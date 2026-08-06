# Getting Started — Standing Up a New Project

The runbook for spinning up an OutSystems design-system project from this template and
running the Figma → OutSystems loop. Four sections: one-time per developer, per-project
setup, triage and integration, and the done-criteria.

---

## A. One-time per developer (do this once on your machine)

1. **Claude Code** — `npm install -g @anthropic-ai/claude-code` (see docs.claude.com/claude-code
   for the current install method).
2. **GitHub CLI** — install `gh`, then `gh auth login`. Needed for findings (bugs), handovers
   (tasks) and the Project board on a private repo.
3. **Node.js** — required for the theme build pipeline.
4. **Figma MCP** — connect the Figma connector in Claude Code so the loop can read the design
   library. Subagents have no Figma access, so the orchestrator is the only thing that talks
   to Figma; without the connector there are no frozen refs, and without a ref nothing gets
   built.
5. **jq** — used by `loop/run.sh` to read loop state (`brew install jq` / `apt install jq`).
6. **Install the `outsystems-loop` plugin.** This is what brings the 13 OutSystems skills and
   the `maker` / `checker` agents. They are **not** in this repo:

   ```
   /plugin marketplace add kharloridado/outsystems-loop
   /plugin install outsystems-loop@outsystems-loop --scope project
   ```

   Everything is then namespaced: `/outsystems-loop:design-loop`, `@outsystems-loop:maker`,
   `@outsystems-loop:checker`. Keep it current with `/plugin update` — the loop improves as
   projects hit real components, and the plugin is how those improvements reach every project
   instead of dying inside the one that made them.

---

## B. Per-project — every new engagement

### 1. Create the project repo from the template

**UI:** open the template repo on GitHub → **Use this template → Create a new repository** →
name it `<customer>-<project>` → **Private** → Create.

**CLI:**

```bash
gh repo create <owner>/<customer>-<project> --private \
  --template <owner>/outsystems-project-template --clone
cd <customer>-<project>
```

### 2. Install and initialise

```bash
npm install
npm run init          # asks for the handful of values that differ between projects
npm run check:config  # must pass — it is part of the build gate
```

`npm run init` writes `project.config.json` and substitutes every `<<PLACEHOLDER>>` across the
scaffold. You answer each question **once**; nothing else in the repo restates these values.

Two things `init` deliberately will **not** do:

- It will not accept the template's example prefix (`acme-`). Pick a real one.
- It will not guess a **convention**. `spacingBase`, `grid`, `breakpoints` and
  `defaultComponentSize` start as `{ "value": null, "status": "TBD" }` and stay that way until
  a human confirms them with the designer. The checker enforces a convention only when its
  status is `confirmed`, and may never raise a finding against one that is not. The previous
  template shipped a plausible `4pt` spacing base that nobody had verified; the loop believed
  it, flagged every value that was not a multiple of four, and produced a queue of
  false-positive bugs. Leave them `TBD` until you actually know.

`npm run check:config` is the guard that makes this stick. It runs as the first step of
`npm run build:theme`, so it also sits inside the checker's deterministic gate: an
uninitialised project, a leaked example prefix, or a malformed convention cannot build — and
therefore cannot pass review.

### 3. Vendor OutSystems UI — and pin it to your environment

```bash
git submodule update --init
```

Then **pin `vendor/outsystems-ui` to the OutSystems UI version your target ODC environment
actually runs** — not `main`, and not simply the newest tag:

```bash
cd vendor/outsystems-ui
git checkout <vX.Y.Z>          # the version the target environment reports
cd ../..
git add vendor/outsystems-ui && git commit -m "chore: pin OutSystems UI to <vX.Y.Z>"
```

The submodule is the source of truth for real rendered widget DOM and SCSS when you design an
override, and it is layer 1 of the local preview (`npm run build:osui`). If it does not match
the environment, you will be designing overrides against markup that the environment never
produces. Record the pinned version and the date you confirmed it in `project-context.md`.

### 4. Set up the GitHub side (labels and boards do **not** copy from a template)

Files travel when you create a repo from a template — including the `.github/ISSUE_TEMPLATE/*`
forms. **Labels, issue types, Projects and branch protection do not.** That is what the setup
scripts are for:

```bash
gh auth refresh -s project                                    # one-time scope for any board command
./.github/setup-finding-labels.sh <owner>/<repo>
./.github/setup-project.sh <owner> <owner>/<repo> "<board name>"
```

The first creates the `finding` / `handover` / type / `sev:*` label taxonomy. The second creates
the Project board that deliverables, findings (bugs) and handovers (tasks) all land on.

**If the board already exists** — including a stock one you made in the GitHub UI, which has
GitHub's default `Todo / In Progress / Done` — do not run `setup-project.sh` (it creates a new
board). Bring the existing one up to spec instead:

```bash
./.github/migrate-project-status.sh <owner> <project-number>            # dry run: prints the plan
./.github/migrate-project-status.sh <owner> <project-number> --confirm
```

It rewrites the `Status` options **in place** via GraphQL — renaming `Todo` → `Backlog` carries
its cards across — and adds the custom fields the loop reads (`Tier`, `Level`, `Type`,
`Severity`, `FigmaNode`, `Branch`, `Runner`). Nothing is deleted, so nothing is lost.

Then record the board so the loop can find it:

```bash
npm run init          # paste the board URL when asked
```

That writes `owner` / `number` into **`project.config.json` → `board`**, which turns board-driven
mode on. Leave them blank and the loop runs from the signed inventory in `loop/goal.md` instead.

Work crosses eight `Status` lanes — **Backlog → Ready → In Progress → Ready for Review →
Approved → Handover → Done**, plus **Blocked**. Two of them are yours alone: **only a human
moves a card into `Approved` or `Done`**, and only `Approved` reaches an OutSystems build. See
`WORKFLOW.md` §2.

### 5. Fill in the brand source of truth

- `design/brand-guidelines.md` — palette, type scale, spacing scale, elevation, and whatever
  the brand owner has already signed off.
- `design/figma-links.md` — the library file URL, plus the node ids of the frames in scope.
- `project-context.md` — the designer / brand-owner contact (where findings go), the developer
  (who handover tasks are assigned to), and the "Known signed-off exceptions" table. An
  approved deviation that is not written down there will be re-flagged as a bug on every run.

### 6. Set the loop goal — including the inventory of record

Edit `loop/goal.md`: the one-sentence goal, the Figma library URL, the branch strategy, the run
caps, and — the part people skip — the **inventory of record**: what is in scope, and who said so.

Set `Inventory source` to match how you are running:

- **`board`** — the card *is* the inventory row, and the signature is a scope owner moving it to
  `Ready`. Have them counter-sign the generated `deliverables.md` on a cadence; that is the
  client-facing artifact. Note the honest limitation recorded in `goal.md`: the loop cannot
  verify *who* moved a card, so restrict write access on the board to people who can commit to
  scope.
- **`artifact`** — the explicit, agreed component list, in build order, in the signed table.

Either way it is a scope contract. Without it the loop will happily build what it finds, and you
discover at review time that half of it was never wanted and a third of what was wanted is
missing. Agree the list before the first run.

### 7. Run the loop

#### Board-driven (the board is the queue)

File a deliverable from `.github/ISSUE_TEMPLATE/deliverable.yml`, drop it in **Backlog**, and move
it to **Ready** once it carries a Figma node or a written spec. Then:

```bash
npm run board:advance -- --dry-run    # print every decision, mutate nothing — do this first
npm run board:advance                 # build one Ready card
```

Review what lands in **Ready for Review**, move it to **Approved**, then:

```bash
npm run board:ship                    # PR → squash-merge to main → handover Task → Handover
```

Want changes instead? Move the card back to **Ready** and comment what you want — the next
`board:advance` reads owner comments as spec updates and rebuilds.

#### Inventory-driven (the queue is `loop/goal.md`)

**Watch the first run.** In Claude Code, in the repo:

```
/outsystems-loop:design-loop  run until the goal in loop/goal.md is met
```

**Unattended, once you trust it:**

```bash
./loop/run.sh 40
```

Per component, the orchestrator first snapshots the Figma spec into `loop/refs/<item-id>/` —
the frozen spec of record, because subagents cannot reach Figma; no ref means the item goes
`needs-human` rather than being built from a guess. Then `@outsystems-loop:maker` builds one
artifact faithfully and `@outsystems-loop:checker` independently judges it. On PASS the
orchestrator commits on the loop branch, opens a handover **Task assigned to the developer**,
and updates the Live Style Guide. Findings are filed as **bugs** and never auto-fixed.
Progress is resumable via `loop/state.json`; `loop/REPORT.md` summarises the run.

---

## C. Triage and integrate — the human part

- **Findings are bugs, and they are for the designer.** Each one says: the design as drawn
  conflicts with accessibility, brand, or the token system, and we built it faithfully anyway.
  The designer / brand owner decides — adjust the design, accept the deviation, or waive it.
  When they accept one, write it into the "Known signed-off exceptions" table in
  `project-context.md`, or the loop will raise it again next week.
- **Handovers are tasks, and they are for the developer.** Each one carries the verbatim CSS
  and JS to paste into ODC — not a repo path to go and find — plus a Mentor Studio prompt that
  scaffolds the OutSystems side (the Block, the attribute bindings, the event wiring). Paste
  the theme (`dist/theme.css`), add the Web Component as a script resource, build the Block.
- **Publish and validate in a real browser.** 1-Click Publish, open it in Chrome, and check
  every breakpoint and the keyboard path. **Never validate in Service Studio Preview** — it
  does not render Web Components the way a browser does, and it will happily tell you
  something works when it does not.
- **Move it on the board.** Nothing reaches an OutSystems build until a human has moved it to
  **Approved**.
- **Wrap up the run.** Push the loop branch, open a PR, and read `loop/REPORT.md` — what was
  built, what was filed, what was challenged out as a false positive, and what was left
  `needs-human`.

---

## D. Done-criteria

A run is done when **every** item in the inventory is either:

- **built** — the maker built it, the checker passed it, it is committed, and a handover task
  is open; or
- **needs-human** — logged with the specific blocker (usually a missing Figma ref, an ambiguous
  spec, or an unconfirmed convention the component depends on);

and every finding is either filed as a bug or recorded in the register as `not-reproduced`
after being adversarially challenged.

Final OutSystems integration is always manual, by design. The loop hands over code; it does not
press publish.
