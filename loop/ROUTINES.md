# Routines — Cloud Scheduling for the Loop

[Claude Code Routines](https://claude.ai/code/routines) run the loop on Anthropic's cloud on a schedule or webhook — your laptop can be off. Create them at `claude.ai/code/routines` or with `/schedule` in the CLI; attach this repo + your Figma connector. (Research preview, all paid plans.)

These are the cloud-native counterpart to `loop/run.sh`. Same loop, same `.claude/settings.json` guardrails — no local machine required.

> **Checkpoints still rule.** Every routine below is told to STOP at the human gates in `loop/goal.md`. A routine never auto-approves foundations or primitives. It advances work and reports; you approve.

---

## 1. Token-drift reconciliation  (highest value — recurring forever)
**Trigger:** weekly (Mon 06:00) + webhook on Figma "library published".
**Prompt:**
```
Re-pull the Figma library at <FIGMA_LIBRARY_URL> via the Figma MCP. Extract the full
token set and reconcile against tokens/*.css: classify each token new / changed /
off-scale / removed. For any drift, file a design-token bug (type Bug, labels
finding,bug,token), dedup by a [token:<name>] marker in the body. Run
`npm run build:theme`. If tokens changed, open a PR "chore(tokens): reconcile design
tokens" on a fresh branch and summarize the drift in the PR body — do NOT merge, do
NOT rebuild components. End with a 5-line summary.
```

**Webhook wiring:** the routine has its own endpoint + token. Point a Figma webhook (or middleware like Zapier) at it so a library publish POSTs the endpoint and triggers a reconcile.

---

## 2. Nightly loop-advance  (inventory mode only — see the warning under §4)
**Trigger:** nightly (02:00).
**Prompt:**
```
Follow the /outsystems-loop:design-loop skill procedure for this repo. Advance the
design-system loop by up to 15 items tonight, in dependency order. RESPECT every checkpoint in
loop/goal.md — if you reach a checkpoint marked "pause", STOP immediately, write
loop/REPORT.md, and do not proceed past it. Persist loop/state.json; commit on the
loop branch and push; ensure new deliverables are on the GitHub Project; open handover
sub-issues under the tier epic; file findings as bugs. Do NOT touch OutSystems. End by
writing a short summary to loop/REPORT.md.
```

---

## 3. Findings digest  (visibility)
**Trigger:** daily (08:00).
**Prompt:**
```
List open issues labeled "finding" in this repo, grouped by severity. Write a short
digest: counts per severity + the blocker/high titles with links. Post it to the team
Slack channel (GitHub Slack app) or, if unavailable, append it to loop/REPORT.md.
Make NO changes to any issue.
```

---

## 4. Ship approved deliverables  (board mode — the one board stage that belongs in the cloud)
**Trigger:** hourly during working hours, or on demand.
**Prompt:**
```
Follow the /outsystems-loop:board-ship skill procedure for this repo. Ship up to 5
Approved cards from the GitHub Project board named in project.config.json -> board:
for each, open a PR from its build branch, squash-merge it into main, VERIFY the PR
reads MERGED before doing anything else, then open the handover Task and move the card
to Handover. If a merge did not complete — a required check failed, or gh armed
auto-merge instead of merging — leave the card in Approved, comment the PR link and the
mergeStateStatus, and move on. Never pass --admin. Never move a card to Approved or
Done. Never create a handover for work that is not on main. End with a 5-line summary
naming anything left in Approved and why.
```

This is safe in the cloud precisely because it needs **no Figma and no browser**: `gh pr create --head`
and `gh pr merge` are server-side, so it needs no working tree of the item's content either.

---

## 5. Board reconcile + deliverables snapshot  (board mode)
**Trigger:** weekly (Fri 17:00).
**Prompt:**
```
Follow the /outsystems-loop:board-sync skill procedure for this repo. Reconcile
loop/state.json against the board and against git, and regenerate deliverables.md from
the board. Report drift you corrected and anything you could not explain — especially
any card in Handover whose branch is not an ancestor of main, which means the board is
claiming work shipped when it did not. Do NOT reclaim stale claims on this schedule and
do NOT move any card. Rewrite the cache, never the board.
```

Reclaiming is deliberately excluded from the schedule: run `--reclaim-stale` by hand, when you know a run
actually died.

---

## Which scheduler for which job

- **Routines (cloud):** token reconciliation, digests, and **`board-ship`** — anything that should run
  with your laptop closed.
- **`/loop` (in-session):** quick "watch this for the next hour" while you're actively working. Dies when
  the session ends.
- **`loop/run.sh` / `loop/board-run.sh` (local):** manual unattended runs when you want local execution
  and local logs. `board-run.sh` takes a `mkdir` lock per stage, so overlapping cron runs are harmless.

> ### ⚠ `board-advance` and the nightly loop-advance must NOT run in the cloud
>
> Both freeze a Figma reference (Figma MCP) and both end in the checker's **rendered-fidelity gate**,
> which drives a real browser. Both of those are interactively authenticated and may simply be absent in
> a headless or scheduled run.
>
> Without them the checker returns `VISUAL: unverified`, which the loop correctly treats as a FAIL — so a
> cloud `board-advance` does not silently ship drift, it just burns a run passing nothing. **That is the
> gate working, not a configuration problem.** Do not "fix" it by relaxing the gate. Run the build stages
> locally and schedule `board-ship` instead.

## Cost note
Routines consume usage; heavy multi-step runs cost more. Prefer nightly/weekly over hourly, let the tier checkpoints bound each run, and test a couple of runs to learn the usage profile before setting an aggressive cadence.
