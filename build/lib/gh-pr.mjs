/* gh-pr.mjs — reading facts that live on a PR branch rather than on `main`.
 *
 * THE PROBLEM THIS EXISTS FOR, stated once so neither caller has to restate it.
 *
 * The loop builds one branch per item and opens one PR. Everything that records what happened
 * to that item — `status: built`, the gate results, the `handover` body path, the handover file
 * itself — is written ON THAT BRANCH. None of it reaches `main` until the PR merges.
 *
 * So `loop/state.json` on `main` describes an item that is mid-flight as though nothing had
 * happened to it: `backlog`, `pr: 0`, no handover. Any script that reads only `main` will draw
 * the wrong conclusion, and both of this repo's board scripts drew it independently:
 *
 *   - ship-board refused every legitimately approved card, because main said `backlog`
 *     while the branch said `built`.
 *   - sync-board read a card dragged back to `Ready` as a FIRST BUILD rather than a rework,
 *     because main said `backlog` — which would have queued a rebuild that silently discarded
 *     the open PR's work.
 *
 * Same root cause, two bugs, found a day apart. Hence one module: `main` answers scope, the PR
 * head answers state, and the lookup lives in exactly one place.
 *
 * Everything here shells out to `gh`, which authenticates via GH_TOKEN independently of the
 * Projects v2 PAT in board-api.mjs.
 */
import { execFileSync } from "node:child_process";

export function gh(cliArgs, { allowFail = false } = {}) {
  try {
    return execFileSync("gh", cliArgs, { encoding: "utf8" }).trim();
  } catch (err) {
    if (allowFail) return null;
    throw new Error(`gh ${cliArgs.slice(0, 3).join(" ")} failed: ${err.stderr || err.message}`);
  }
}

/** The branch the loop uses for an item. `loop/goal.md`: one branch per item, `loop/item/<id>`. */
export const branchForItem = (item) => item.branch || `loop/item/${item.id}`;

/** Read a file at an arbitrary ref without needing it fetched locally — an Actions checkout has
 *  only `main`, and the content these callers need is on a branch it has never fetched. */
export function fileAtRef(repo, path, ref) {
  const raw = gh(["api", `repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`, "--jq", ".content"], {
    allowFail: true,
  });
  if (!raw) return null;
  try {
    return Buffer.from(raw.replace(/\s/g, ""), "base64").toString("utf8");
  } catch {
    return null;
  }
}

const PR_FIELDS =
  "number,state,isDraft,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,headRefOid,url,title";

/** The PR for a branch, preferring an open one.
 *
 *  Discovered from the BRANCH, never from `item.pr`: the loop does not reliably write its own
 *  PR number back into state.json. Measured on the source project — a built item carried
 *  `pr: 0` on its own branch with its PR open against it, so trusting that field finds nothing.
 *  A branch name is a fact
 *  GitHub can confirm. */
export function prForBranch(repo, branch, { includeMerged = true } = {}) {
  const raw = gh(["pr", "list", "--repo", repo, "--head", branch, "--state", "all", "--json", PR_FIELDS], {
    allowFail: true,
  });
  if (!raw) return null;
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    return null;
  }
  return list.find((p) => p.state === "OPEN") || (includeMerged ? list.find((p) => p.state === "MERGED") : null) || null;
}

/** The item as its own PR branch records it, or null if there is no PR / nothing readable.
 *
 *  Returns `{ pr, item }` so the caller can report WHICH PR it believed — a re-queue or a merge
 *  attributed to no PR is impossible to audit afterwards. */
export function itemAtPrHead(repo, item) {
  const branch = branchForItem(item);
  const pr = prForBranch(repo, branch);
  if (!pr) return null;
  const raw = fileAtRef(repo, "loop/state.json", pr.headRefOid || branch);
  if (!raw) return { pr, item: null };
  try {
    return { pr, item: JSON.parse(raw).items?.find((i) => i.id === item.id) ?? null };
  } catch {
    return { pr, item: null };
  }
}
