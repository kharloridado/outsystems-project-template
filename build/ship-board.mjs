#!/usr/bin/env node
/* ship-board.mjs — ship the cards a human has approved.
 *
 * For every card in the `Approved` lane: squash-merge its open PR into main, open the handover
 * Task, and move the card to `Handover`.
 *
 * THIS SCRIPT MERGES TO `main`. It is the only thing in this repo that does, and it exists
 * because of a deliberate decision recorded in CLAUDE.md hard rule 10:
 *
 *   The signature is the human dragging the card into `Approved`. This script executes that
 *   signature; it does not grant it. No agent may move a card INTO `Approved` — not this
 *   script, not the loop, not the checker, not on a PASS, not to "correct" a disagreement.
 *
 * That is the property worth protecting: no single actor both approves and merges. An agent
 * that could write `Approved` would make the whole gate decorative, so `Approved` and `Done`
 * stay human-only and this script refuses to write either.
 *
 * WHERE THE FACTS LIVE — the thing that makes this script harder than it looks.
 *
 * The loop builds one branch per item and opens one PR. Everything that proves an item is
 * shippable — `status: built`, the gate results, the `handover` body path, the handover file
 * itself — is written ON THAT BRANCH and does not reach `main` until the merge this script is
 * deciding whether to perform. Reading `loop/state.json` from `main` therefore tells you the
 * item is still `backlog` with no PR and no handover, and every legitimately approved card gets
 * refused. (Measured on the source project: main said `backlog`/`pr: 0`
 * while the branch said `built` with a handover body sitting next to it.)
 *
 * So: `main` is read for SCOPE (does this item exist, is it in the signed inventory, has it
 * already shipped), and the PR HEAD is read for READINESS. The PR itself is discovered from the
 * branch, not from `item.pr` — the loop does not reliably write its own PR number back, and a
 * branch name is a fact GitHub can confirm.
 *
 * WHAT IT REFUSES TO SHIP — every one of these is a silent-corruption story, not a nicety:
 *   - no open PR for the item's branch                   (nothing to merge)
 *   - the PR head does not say `built`/`approved`        (nothing was ever validated)
 *   - a PR that is draft, closed, or has changes requested
 *   - a PR whose required checks are not green           (CI is the re-verification gate)
 *   - a PR that is not mergeable (conflicts with main)
 *   - an item with no row in loop/goal.md's signed inventory
 *   - a handover body that does not exist on the PR head (a handover Task with no code)
 * A refusal is reported and the card is left exactly where it is. It never guesses.
 *
 * WHY IT RUNS IN GITHUB ACTIONS. Projects v2 is GraphQL-only and unreachable from a Claude
 * Code cloud routine. Moving a card to `Handover` is a GraphQL mutation, so the ship stage
 * cannot be a cloud routine no matter how it is written. See loop/ROUTINES.md §1c.
 *
 *   node build/ship-board.mjs --dry-run    # report what would ship, touch nothing
 *   node build/ship-board.mjs              # ship
 *   node build/ship-board.mjs --json       # machine-readable summary
 *
 * Token: BOARD_SYNC_TOKEN needs the `project` scope (writing a field value, not just reading).
 * `gh` is used for the PR lookup, merge and issue, and authenticates separately via GH_TOKEN.
 */
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { boardToken, fetchBoard, laneOf, nameOf, setCardLane } from "./lib/board-api.mjs";
import { branchForItem, fileAtRef, gh, prForBranch } from "./lib/gh-pr.mjs";
import { projectConfig, root } from "./lib/project-config.mjs";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const DRY = has("--dry-run");
const JSON_OUT = has("--json");

const STATE_PATH = join(root, "loop", "state.json");
const GOAL_PATH = join(root, "loop", "goal.md");

/* The lane this script writes. `Approved` and `Done` are deliberately absent and must stay
 * absent — see the header. */
const SHIP_TO_LANE = "Handover";

/* Statuses on the PR HEAD that mean the work was validated. */
const SHIPPABLE_STATUSES = new Set(["built", "approved"]);

/* Statuses on MAIN that mean this already shipped — skip silently rather than refuse noisily. */
const ALREADY_DONE = new Set(["handover", "shipped"]);

function fail(msg) {
  console.error(`ship:board → ${msg}`);
  process.exit(1);
}

function signedInventoryIssues() {
  const md = readFileSync(GOAL_PATH, "utf8");
  const issues = new Set();
  for (const m of md.matchAll(/\[#(\d+)\]\([^)]*\/issues\/\d+\)/g)) issues.add(Number(m[1]));
  return issues;
}

/** Reasons this PR must not be merged. Empty array means it may.
 *
 *  `stale` is returned separately from a refusal: `main` has `required_status_checks.strict`
 *  on, so a PR that is merely BEHIND is blocked by branch protection even with green checks.
 *  That is not a problem to report at a human, it is a problem to fix and retry — see the
 *  caller. Without this the merge call itself fails, which reads like a permissions error. */
function blockers(pr) {
  const out = [];
  if (!pr) return ["no PR found for the item's branch"];
  if (pr.state !== "OPEN") out.push(`PR is ${pr.state}`);
  if (pr.isDraft) out.push("PR is a draft");
  if (pr.reviewDecision === "CHANGES_REQUESTED") out.push("a reviewer requested changes");
  if (pr.mergeable === "CONFLICTING") out.push("PR conflicts with main");
  if (pr.mergeStateStatus === "DIRTY") out.push("PR conflicts with main");
  if (pr.mergeStateStatus === "BLOCKED") {
    out.push("branch protection blocks the merge (a required review or check is unsatisfied)");
  }
  if (pr.mergeStateStatus === "UNKNOWN") {
    out.push("GitHub has not computed mergeability yet — refusing to merge on an unknown state");
  }

  /* CI is the re-verification gate. The checker's verdict was computed once, at build time,
   * against a head that may no longer be what would merge — a fixup commit, or a token changed
   * on main, and the PR still carries a measurement describing something else. A red or missing
   * check is therefore a hard stop, not a warning. */
  const checks = pr.statusCheckRollup ?? [];
  const failed = checks.filter((c) => {
    const s = (c.conclusion || c.state || "").toUpperCase();
    return s && !["SUCCESS", "NEUTRAL", "SKIPPED"].includes(s);
  });
  const pending = checks.filter((c) => !(c.conclusion || c.state));
  if (failed.length) out.push(`checks not green: ${failed.map((c) => c.name || c.context).join(", ")}`);
  if (pending.length) out.push(`checks still running: ${pending.map((c) => c.name || c.context).join(", ")}`);
  if (!checks.length) {
    out.push(
      "no status checks reported — refusing to merge unverified. " +
        "A PR cut before .github/workflows/verify.yml existed has none; update the branch from main to make CI run."
    );
  }
  return out;
}

function main() {
  return run().catch((e) => fail(e.message));
}

async function run() {
  const cfg = projectConfig();
  const board = cfg.board ?? {};
  if (!board.owner || !board.number) fail("project.config.json → board has no owner/number pointer.");
  if (board.drivesLoop === true) {
    fail("board.drivesLoop is true — board-advance owns the lifecycle in that mode. Refusing to ship.");
  }

  const repo = cfg.repo;
  const state = JSON.parse(readFileSync(STATE_PATH, "utf8"));
  const signed = signedInventoryIssues();
  const tok = boardToken({ fail });
  const { id: projectId, statusField, nodes } = await fetchBoard(board, tok, { fail });

  const byIssue = new Map();
  for (const card of nodes) if (card.content?.number) byIssue.set(card.content.number, card);

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const shipped = [];
  const refused = [];
  const skipped = [];
  const stale = [];

  for (const item of state.items ?? []) {
    const card = item.issue ? byIssue.get(item.issue) : null;
    if (!card || laneOf(card) !== "Approved") continue;

    const name = nameOf(card);
    const refuse = (why) => refused.push({ id: item.id, issue: item.issue, name, why });

    // ---- SCOPE checks, answered by `main` -------------------------------------------------
    if (!item.issue || !signed.has(item.issue)) {
      refuse("no row in loop/goal.md's signed inventory");
      continue;
    }
    if (ALREADY_DONE.has(item.status)) {
      skipped.push({ id: item.id, issue: item.issue, name, why: `already \`${item.status}\`` });
      continue;
    }

    // ---- READINESS checks, answered by the PR HEAD ----------------------------------------
    const branch = branchForItem(item);
    const pr = prForBranch(repo, branch);
    if (!pr) {
      refuse(`no PR found for branch \`${branch}\``);
      continue;
    }

    /* The item's built state lives on the PR branch, not on main. Read it there. */
    const headStateRaw = fileAtRef(repo, "loop/state.json", pr.headRefOid || branch);
    if (!headStateRaw) {
      refuse(`could not read loop/state.json at the head of PR #${pr.number}`);
      continue;
    }
    let headItem;
    try {
      headItem = JSON.parse(headStateRaw).items?.find((i) => i.id === item.id);
    } catch {
      refuse(`loop/state.json at the head of PR #${pr.number} is not valid JSON`);
      continue;
    }
    if (!headItem) {
      refuse(`PR #${pr.number} has no \`${item.id}\` item in its loop/state.json`);
      continue;
    }
    if (!SHIPPABLE_STATUSES.has(headItem.status)) {
      refuse(
        `PR #${pr.number} says \`${headItem.status}\` — only \`built\` or \`approved\` may ship ` +
          "(nothing else has passed the checker)"
      );
      continue;
    }

    const handoverPath = headItem.handover;
    if (!handoverPath) {
      refuse(`PR #${pr.number} records no handover body — a handover Task must carry the code to paste`);
      continue;
    }
    const handoverBody = fileAtRef(repo, handoverPath, pr.headRefOid || branch);
    if (!handoverBody) {
      refuse(`handover body \`${handoverPath}\` does not exist on PR #${pr.number}'s head`);
      continue;
    }

    if (pr.state === "MERGED") {
      /* Already merged — a previous run died between the merge and the lane move, or someone
       * merged by hand. Finish the job rather than refusing; that is what makes this
       * self-healing instead of needing a human to unstick it. */
      shipped.push(
        await finishShip({ item, headItem, card, pr, handoverBody, repo, projectId, statusField, tok, now, DRY, alreadyMerged: true })
      );
      continue;
    }

    /* BEHIND is not a refusal, it is a chore. `main` runs required_status_checks.strict, so an
     * out-of-date branch cannot merge even with green checks — and left alone, an approved card
     * would stall forever every time anything else lands on main first.
     *
     * Update the branch and stop for this round. The update changes the head, so CI must re-run
     * before anything merges: that is the re-verification working, not an obstacle to route
     * around. The next hourly run ships it. */
    if (pr.mergeStateStatus === "BEHIND") {
      if (DRY) {
        stale.push({ id: item.id, issue: item.issue, name, pr: pr.number, why: "behind main — would update the branch and ship next run" });
      } else {
        gh(["pr", "update-branch", String(pr.number), "--repo", repo], { allowFail: true });
        stale.push({ id: item.id, issue: item.issue, name, pr: pr.number, why: "was behind main — branch updated; ships next run once CI is green" });
      }
      continue;
    }

    const why = blockers(pr);
    if (why.length) {
      refuse(why.join("; "));
      continue;
    }

    if (DRY) {
      shipped.push({ id: item.id, issue: item.issue, name, pr: pr.number, handover: handoverPath, dryRun: true });
      continue;
    }

    gh(["pr", "merge", String(pr.number), "--repo", repo, "--squash", "--delete-branch"]);
    shipped.push(
      await finishShip({ item, headItem, card, pr, handoverBody, repo, projectId, statusField, tok, now, DRY })
    );
  }

  if (!DRY && shipped.length) writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");

  const summary = { dryRun: DRY, shipped, refused, skipped, stale };
  if (JSON_OUT) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`ship:board → ${shipped.length} shipped, ${refused.length} refused, ${stale.length} updated, ${skipped.length} skipped`);
    for (const s of shipped) {
      console.log(
        `  ✓ ${s.name} (#${s.issue}) — PR #${s.pr}` +
          (s.dryRun ? ` [would merge; handover ${s.handover}]` : ` merged, handover #${s.handover_issue}, lane → ${SHIP_TO_LANE}`)
      );
    }
    for (const r of refused) console.log(`  ✗ ${r.name} (#${r.issue}) — ${r.why}`);
    for (const t of stale) console.log(`  ↻ ${t.name} (#${t.issue}) — PR #${t.pr} ${t.why}`);
    for (const s of skipped) console.log(`  · ${s.name} (#${s.issue}) — ${s.why}`);
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `shipped=${shipped.length}\nrefused=${refused.length}\nskipped=${skipped.length}\n` +
        `summary<<EOF\n${JSON.stringify(summary)}\nEOF\n`
    );
  }
}

/** Post-merge: open the handover Task, move the card, update state. One function so the
 *  already-merged recovery path and the normal path cannot drift apart. */
async function finishShip({ item, headItem, card, pr, handoverBody, repo, projectId, statusField, tok, now, DRY, alreadyMerged = false }) {
  const name = nameOf(card);
  if (DRY) {
    return { id: item.id, issue: item.issue, name, pr: pr.number, handover: headItem.handover, dryRun: true, alreadyMerged };
  }

  /* The handover Task is opened AFTER the merge, never at checker-PASS. A handover says "paste
   * this into a live environment"; saying that about an unmerged branch is how unreviewed code
   * ships (hard rule 11). */
  let handoverIssue = item.handover_issue || 0;
  if (!handoverIssue) {
    const title = `[handover] ${name} — add in OutSystems`;
    /* Dedup before creating: a re-run must never open a second Task for the same component. */
    const existing = gh(
      ["issue", "list", "--repo", repo, "--label", "handover", "--state", "all", "--search", `"${title}" in:title`, "--json", "number,title"],
      { allowFail: true }
    );
    const found = existing ? JSON.parse(existing).find((i) => i.title === title) : null;
    if (found) {
      handoverIssue = found.number;
    } else {
      /* Write the body read from the PR head to a temp file — the local checkout is `main`, and
       * before this merge the handover file was not on it. */
      const tmp = join(tmpdir(), `handover-${item.id}-${process.pid}.md`);
      writeFileSync(tmp, handoverBody);
      const url = gh([
        "issue", "create", "--repo", repo, "--title", title,
        "--body-file", tmp, "--label", "handover,task", "--type", "Task", "--assignee", "@me",
      ]);
      handoverIssue = Number(String(url).trim().split("/").pop());
    }
  }

  const lane = await setCardLane({ projectId, itemId: card.id, statusField, lane: SHIP_TO_LANE }, tok, { fail });

  const mergedSha = gh(["pr", "view", String(pr.number), "--repo", repo, "--json", "mergeCommit", "--jq", ".mergeCommit.oid"], {
    allowFail: true,
  });

  /* Carry the build's own record forward. Without this the merge would drop the gate results
   * and decision log that only ever existed on the branch. */
  for (const k of ["level", "artifact", "det_gate", "visual", "confidence", "risk_tier", "ref_dir", "handover", "run_id", "rounds"]) {
    if (headItem[k] !== undefined && headItem[k] !== "") item[k] = headItem[k];
  }
  if (headItem.decision_log) item.decision_log = headItem.decision_log;

  item.status = "handover";
  item.board_status = lane;
  item.pr = pr.number;
  item.branch = branchForItem(item);
  item.handover_issue = handoverIssue;
  item.merged_at = now;
  if (mergedSha) item.sha = mergedSha;
  item.shipped_by = "build/ship-board.mjs";
  item.decision_log =
    (item.decision_log ? item.decision_log + " " : "") +
    `SHIP ${now}: card was in Approved (the human signature); PR #${pr.number} ` +
    `${alreadyMerged ? "was already merged" : "squash-merged"} to main, handover Task #${handoverIssue}, card moved to ${lane}.`;

  return { id: item.id, issue: item.issue, name, pr: pr.number, handover_issue: handoverIssue, alreadyMerged };
}

await main();
