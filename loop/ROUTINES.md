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

## 2. Nightly loop-advance  (the cloud driver — queues from files, never from a board)
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

## 4. Board → files sync  (**GitHub Actions, NOT a Claude routine**)
**Trigger:** `.github/workflows/board-sync.yml` — every 15 min during working hours, plus
`workflow_dispatch`. Locally: `npm run sync:board` (`:dry` to look first).

The answer to *"I moved a card; does the loop know?"* Before this existed the answer was no, and
there was no way to find out except asking why the nightly run ignored a card.

**It cannot be a Claude routine.** Projects v2 is GraphQL-only and unreachable from a cloud
session — no `gh`, no `project_*` MCP tool, no GraphQL passthrough, egress proxy refuses
`api.github.com/graphql`. Actions runs on GitHub's own infrastructure where it is an ordinary
request. Actions reads the board and writes plain files; the routine reads plain files.

**It polls because there is nothing to subscribe to.** `projects_v2_item` fires for
**organization** projects only; a user-owned project has no event.

Everything it changes arrives as **one PR**, and merging it is the signature. The mirror cannot be
pushed straight to `main` when `main` has a required check — a direct push is rejected with
`GH006`, because a protected branch admits no unreviewed commit however harmless.

**Setup:** a CLASSIC PAT with the `project` scope, stored as repo secret `BOARD_SYNC_TOKEN`. The
Actions `GITHUB_TOKEN` cannot read a user-owned Projects v2 board at all. A **fine-grained** PAT
returns an empty result rather than an error, which is indistinguishable from a missing board.

---

## 5. Approved → shipped  (**GitHub Actions, NOT a Claude routine**)
**Trigger:** `.github/workflows/board-ship.yml` — hourly during working hours;
`workflow_dispatch` defaults to dry-run. Locally: `npm run ship:board:dry`.

For each card in `Approved`: squash-merge its PR, open the handover Task, move the card to
`Handover`.

**This section used to say board-ship was "the one board stage that belongs in the cloud."** That
was wrong, and it was expensive: moving a card is a Projects v2 mutation, so a cloud routine could
never do it. Measured on the source project — the hourly cloud board-ship fired nine times a
weekday and every run was a guaranteed no-op, for days, while looking healthy.

**It refuses more than it ships**, and each refusal is a silent-corruption story: an item not
`built`/`approved` was never validated; a draft/closed/changes-requested PR is not finished; checks
that are red, still running, **or absent entirely** mean the head was never re-verified; a missing
handover body would tell a developer to paste nothing.

**It is self-healing:** a PR already merged — a crashed run, or a hand merge — is *finished* rather
than refused. Handover Tasks are deduplicated by title.

**Setup:** `BOARD_SYNC_TOKEN` needs the full **`project`** scope here (moving a card writes a field
value), not just `read:project`.

---

## Environment gotchas that cost real nights

Each of these produced a run that looked healthy and delivered nothing.

| Symptom | Cause | Fix |
|---|---|---|
| Every item FAILs the fidelity gate | `vendor/outsystems-ui` is a submodule; a fresh clone gets it **empty**, so the framework stylesheet is never compiled. A missing stylesheet does not throw — the cascade falls back and every measurement is a plausible number describing a page nobody will see. `unverified` caps at FAIL. | Pre-flight: `npm ci && git submodule update --init vendor/outsystems-ui && npm run build:osui` |
| Run produces nothing, no refs frozen | No Figma connector attached to the routine. No ref can be frozen, so every item goes `needs-human` rather than being built from a guess. | Attach it in the routine's settings |
| `@<plugin>:maker` / `:checker` unavailable; falls back to general-purpose agents | The plugin marketplace repo is **private**. A cloud container has none of your credentials, so it cannot clone it and `installed_plugins.json` stays empty. | Make the marketplace repo public |
| Sync PR never merges: "waiting for approval" | GitHub gates workflow runs on PRs authored by `github-actions[bot]` — **once**. | Approve the first one; subsequent runs are trusted |
| Actions cannot open the PR at all | Repo setting "Allow GitHub Actions to create and approve pull requests" is off | Enable it. Check first whether approvals gate anything: if `required_pull_request_reviews` is absent, this grants only the *create* half |
| `figma.png` cannot be saved in a cloud run | Egress policy blocks `www.figma.com` (403 on CONNECT), even though the Figma **MCP tools** work | Freeze the ref from `get_design_context` + `get_variable_defs` and record the gap; do not claim a visual check you did not make |

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
