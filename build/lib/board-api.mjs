/* board-api.mjs — the ONE place build scripts talk to GitHub Projects v2 from.
 *
 * `sync-board.mjs` reads the board; `ship-board.mjs` reads it and moves cards. Both need the
 * same token resolution, the same GraphQL error handling, and the same user-or-organization
 * fallback on the project lookup. Extracted here rather than duplicated, for the reason
 * `project-config.mjs` exists at all: a fact restated in two files is a fact that will
 * eventually disagree with itself.
 *
 * NOTHING IN HERE IS PROJECT-SPECIFIC. The board pointer (owner, number) is a project value
 * and lives in project.config.json → board; every function takes it as an argument.
 *
 * Projects v2 is GraphQL-only. That single fact is why board work runs in GitHub Actions and
 * never in a Claude Code cloud routine: a routine has no `gh` on PATH, no `project_*` MCP
 * tool, no GraphQL passthrough, and its egress proxy refuses api.github.com/graphql.
 */
import { execFileSync } from "node:child_process";

const API = "https://api.github.com/graphql";

/** Resolve a token. Needs the `project` scope — `read:project` is enough to read a board,
 *  writing a field value needs `project`. The Actions GITHUB_TOKEN CANNOT read a user-owned
 *  Projects v2 board at all, which is the only reason a PAT is involved. */
export function boardToken({ fail = defaultFail } = {}) {
  /* Trim for canonicality, not because it fixes an auth failure. `echo "$TOKEN" | gh secret
   * set …` stores a trailing newline, and the `gh auth token` path below has always trimmed
   * while this one did not — so the two paths could hold different strings for the same token.
   *
   * It is NOT the cause of a 401: GitHub accepts `bearer <token>\n` and `bearer <token> `
   * (measured 2026-08-13 — both returned 200 against the same query that was 401ing). Do not
   * let this line become the explanation for an auth failure; look at `describeToken` instead. */
  const fromEnv = process.env.BOARD_SYNC_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (fromEnv?.trim()) return fromEnv.trim();
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    fail(
      "no token. Set BOARD_SYNC_TOKEN (a PAT with the `project` scope) or run `gh auth login`.\n" +
        "  The Actions GITHUB_TOKEN cannot read a user-owned Projects v2 board — it must be a PAT."
    );
  }
}

/** Describe a token by SHAPE, never by value, so a 401 can say something useful in a log that
 *  anyone can read. The prefix is a type marker, not a secret; the rest is never printed. */
export function describeToken(tok) {
  const raw = process.env.BOARD_SYNC_TOKEN ?? "";
  const untrimmed = raw.length !== raw.trim().length ? " (the stored value has surrounding whitespace)" : "";
  if (!tok) return "no token";
  if (tok.startsWith("ghp_")) return `classic PAT${untrimmed}`;
  if (tok.startsWith("github_pat_")) return `FINE-GRAINED PAT${untrimmed} — this needs a CLASSIC token with the \`project\` scope`;
  if (tok.startsWith("ghs_")) return `GitHub App / Actions token${untrimmed} — the built-in GITHUB_TOKEN cannot read a user-owned Projects v2 board`;
  if (tok.startsWith("gho_")) return `OAuth token${untrimmed}`;
  return `unrecognised token shape${untrimmed} — expected a classic PAT starting \`ghp_\``;
}

function defaultFail(msg) {
  console.error(`board-api → ${msg}`);
  process.exit(1);
}

export async function gql(query, variables, tok, { fail = defaultFail } = {}) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `bearer ${tok}`,
      "Content-Type": "application/json",
      "User-Agent": "outsystems-loop-board-api",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) {
      fail(
        `GraphQL 401 — GitHub rejected the credential. Token looks like: ${describeToken(tok)}.\n` +
          "  401 means invalid or expired, NOT under-scoped — a missing `project` scope is a 403 or a resolve error.\n" +
          "  Surrounding whitespace is not the cause either; GitHub accepts it. So the stored value is not a\n" +
          "  token GitHub recognises: it is the wrong TYPE, it has expired or been regenerated, or only part\n" +
          "  of it was pasted. Re-store with `gh secret set BOARD_SYNC_TOKEN` and let it prompt."
      );
    }
    if (res.status === 403) fail("GraphQL 403 — the token lacks the `project` scope.");
    fail(`GraphQL HTTP ${res.status}: ${JSON.stringify(body)?.slice(0, 400)}`);
  }
  if (body?.errors?.length) {
    const msgs = body.errors.map((e) => e.message).join("; ");
    /* A resolve error is not fatal here: fetchBoard tries the login as a user and then as an
     * organization, so exactly one of those two is expected to fail for any real account.
     * Hand it back and let the caller decide.
     *
     * `an?` matters. GitHub writes "Could not resolve to an Organization" but "…to a User", and
     * the pattern used to require "a ". So the organization attempt never matched, fell through
     * to fail(), and killed the run with the message from the attempt that was SUPPOSED to fail
     * — hiding whatever the user attempt actually said. */
    if (/resolve to an? (User|Organization|ProjectV2)/i.test(msgs)) return { __resolveError: msgs, ...body.data };
    /* A missing `project` scope surfaces here too, as a scope error rather than a 403. */
    if (/not been granted the required scopes|requires one of the following scopes/i.test(msgs)) {
      return { __scopeError: msgs, ...body.data };
    }
    fail(`GraphQL: ${msgs}`);
  }
  return body.data;
}

const ITEMS_QUERY = `
query($login:String!, $number:Int!, $cursor:String) {
  OWNER(login:$login) {
    projectV2(number:$number) {
      id
      title
      field(name:"Status") {
        ... on ProjectV2SingleSelectField { id name options { id name } }
      }
      items(first:100, after:$cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          status: fieldValueByName(name:"Status")  { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          tier:   fieldValueByName(name:"Tier")    { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          level:  fieldValueByName(name:"Level")   { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          type:   fieldValueByName(name:"Type")    { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          content {
            __typename
            ... on Issue      { number title url state }
            ... on PullRequest{ number title url state }
            ... on DraftIssue { title }
          }
        }
      }
    }
  }
}`;

/** Read every card, plus the Status field and its option ids.
 *
 *  Tries the login as a user first, then as an organization — the pointer in
 *  project.config.json records a login, not which kind of account owns it.
 *
 *  The Status field id and option ids are fetched LIVE rather than read from
 *  state.json.board_cache. The cache is a convenience for locally-invoked skills; an id that
 *  stops resolving means somebody recreated the field, and a mutation against a stale id
 *  fails in a way that reads like a permissions problem. */
export async function fetchBoard({ owner, number }, tok, { fail = defaultFail } = {}) {
  /* Why both attempts are recorded: exactly one of user/organization is expected to fail for
   * any real account, so reporting only the LAST failure reliably reports the uninteresting
   * one. When the board owner is a USER account, the organization attempt always fails with "could not
   * resolve to an Organization" — which says nothing about why the user attempt came back
   * empty, and that is the question. */
  const attempts = [];
  for (const kind of ["user", "organization"]) {
    const q = ITEMS_QUERY.replace("OWNER(", `${kind}(`);
    const nodes = [];
    let cursor = null;
    let meta = null;
    let ok = true;
    while (true) {
      const data = await gql(q, { login: owner, number, cursor }, tok, { fail });
      if (data?.__scopeError) attempts.push(`as ${kind}: SCOPE — ${data.__scopeError}`);
      else if (data?.__resolveError) attempts.push(`as ${kind}: ${data.__resolveError}`);
      const project = data?.[kind]?.projectV2;
      if (!project) {
        if (!data?.__scopeError && !data?.__resolveError) {
          attempts.push(`as ${kind}: the query succeeded but returned no project #${number} (account resolved, project did not)`);
        }
        ok = false;
        break;
      }
      meta = { id: project.id, title: project.title, statusField: project.field ?? null };
      nodes.push(...project.items.nodes);
      if (!project.items.pageInfo.hasNextPage) break;
      cursor = project.items.pageInfo.endCursor;
    }
    if (ok && meta) return { ...meta, nodes };
  }
  const scoped = attempts.some((a) => a.includes("SCOPE"));
  fail(
    `could not read project #${number} for "${owner}" as either a user or an organization.\n` +
      attempts.map((a) => `    ${a}`).join("\n") +
      `\n  Token looks like: ${describeToken(tok)}.\n` +
      (scoped
        ? "  The token authenticated but lacks the scope for Projects v2. A CLASSIC PAT needs `project`\n" +
          "  (or at least `read:project`); tick it at https://github.com/settings/tokens and re-store the secret."
        : "  Both lookups resolved nothing. Check the pointer in project.config.json → board (owner/number),\n" +
          "  and that the token can see the project: a FINE-GRAINED PAT returns an empty result rather than an\n" +
          "  error when it has no Projects permission, which looks exactly like this. A classic PAT with\n" +
          "  `project` is the supported shape here.")
  );
}

/** Move one card to a Status lane. Writing a field value needs the `project` scope, not just
 *  `read:project`.
 *
 *  Callers are responsible for the policy question of WHETHER a card may be moved. This
 *  function will happily write any lane; `Approved` and `Done` are forbidden to agents by
 *  hard rule 10, and that rule is enforced at the call site where the reason is visible. */
export async function setCardLane({ projectId, itemId, statusField, lane }, tok, { fail = defaultFail } = {}) {
  if (!statusField?.id) fail("the board has no single-select `Status` field — cannot move a card.");
  const option = (statusField.options ?? []).find((o) => o.name === lane);
  if (!option) {
    fail(
      `the board's Status field has no option named "${lane}". Options: ` +
        (statusField.options ?? []).map((o) => o.name).join(", ")
    );
  }
  await gql(
    `mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){
       updateProjectV2ItemFieldValue(input:{
         projectId:$project, itemId:$item, fieldId:$field,
         value:{ singleSelectOptionId:$option }
       }) { projectV2Item { id } }
     }`,
    { project: projectId, item: itemId, field: statusField.id, option: option.id },
    tok,
    { fail }
  );
  return option.name;
}

export const laneOf = (card) => card.status?.name ?? null;
export const nameOf = (card) =>
  (card.content?.title ?? "(untitled card)").replace(/^\s*\[deliverable\]\s*/i, "").trim();
