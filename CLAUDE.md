# CLAUDE.md — Project Rules

This file tells Claude how to work on **this** project. It is the behavioural half of the
scaffold. The **values** half — class prefix, JS namespace, design-system name, ODC theme
module, repo, Figma file, conventions — lives in **[`project.config.json`](./project.config.json)**,
and this file deliberately does not repeat any of them.

## Where the values live: `project.config.json`, and nowhere else

**Read `project.config.json` at the start of any task that needs a project value.** Build
scripts read it through `build/lib/project-config.mjs`; the `maker` and `checker` agents
read it directly. It is the single source of truth for:

| Key | What it is |
| --- | --- |
| `customer`, `project`, `designSystemName` | Identity used in comments, headers, issue titles. |
| `classPrefix` | The BEM prefix every generated class starts with. |
| `jsNamespace` | The `window.<Ns>…` namespace for Web Component helpers. |
| `odcThemeModule` | The ODC theme module name (used in self-hosted font paths). |
| `repo`, `findings.*` | Where issues are filed and how they are routed. |
| `figma` | The library file key + URL. |
| `conventions` | Spacing base, grid, breakpoints, default component size — **three-state** (below). |
| `knownFalsePositiveClasses` | Finding classes that have already been refuted; never re-file them. |

**Why this rule exists.** The previous generation of this template typed the class prefix
into the agents, nine build scripts, `CLAUDE.md` **and** `project-context.md`. Nothing read
config; everything restated it. They drifted, and the shipped project spent its entire life
with two config files that disagreed about its own class prefix. One source, many readers.
If you find yourself about to write a prefix or a spacing value into a doc or a script:
don't — read it from config.

`npm run check:config` enforces this. It runs as the first step of `npm run build:theme`
(and therefore inside the checker's deterministic gate) and fails the build if any
`<<PLACEHOLDER>>` survives, if the template's example prefix `acme-` has leaked into real
code under `tokens/`, `src/`, `preview/` or `style-guide/`, or if a convention is malformed.

## Conventions are three-state — and only `confirmed` is a rule

Every entry in `conventions` is an object, never a bare value:

```jsonc
"spacingBase": { "value": 4, "status": "confirmed" }   // a rule — enforce it
"spacingBase": { "value": 4, "status": "assumed" }     // NOT a rule — do not enforce
"spacingBase": { "value": null, "status": "TBD" }      // NOT a rule — do not enforce
```

**The `checker` may never raise a finding against a convention whose status is not
`confirmed`.** A convention only becomes a rule when the designer or brand owner has
actually said so, and someone has promoted it in `project.config.json`.

This exists because the old template shipped `Spacing base: 4pt` as a plausible default
that nobody had verified. The loop believed it, flagged every value that was not a multiple
of four, and manufactured a queue of false-positive findings — one of which was filed as a
bug and closed as not-planned. **A credible-looking default is worse than a blank.** When a
value is unknown, leave it `TBD` and say so.

## The one rule that matters most here

**Build the design exactly as specified. Never silently change a brand color, value, or
token to satisfy accessibility or to "tidy" the design.** When the design conflicts with
accessibility, brand, or token rules, implement it faithfully and raise a **finding** (see
`findings/`). The finding carries the recommendation back to design; the code stays true to
the mockup until design responds or the brand owner signs off.

Implementation-level accessibility that does **not** change the visual design — focus rings
in the design's own colors, keyboard handlers, ARIA, semantic HTML, reduced-motion, labels —
is applied automatically, without a finding.

Deviations that the brand owner has already approved belong in the "Known signed-off
exceptions" section of `project-context.md`. The loop reads that file; a decision that only
lives in a meeting note will be re-flagged as a bug forever.

## The plugin: where the skills and agents actually come from

The 13 OutSystems skills and the `maker` / `checker` agents are **not** copied into this
repo's `.claude/`. They are a versioned Claude Code plugin, **`outsystems-loop`**:

```
/plugin marketplace add kharloridado/outsystems-loop
/plugin install outsystems-loop@outsystems-loop --scope project
```

Invoke them namespaced: `/outsystems-loop:design-loop`, `@outsystems-loop:maker`,
`@outsystems-loop:checker`.

**Why.** Every project used to receive a *copy* of the skills. Improvements made while
fighting a real component never flowed back, so the template went stale and the next
project silently started from an older, worse loop. As a plugin, the loop is versioned
once: bump it, and `/plugin update` reaches every project that installed it. Fix the
plugin, not your local copy — a local copy is the bug.

This repo's `.claude/` keeps only what is genuinely project-scoped: `settings.json`
(permissions, deny-list, hooks).

## Findings routing (used by the `outsystems-design-findings` skill)

The live values are `findings.*` in `project.config.json`:

```
findings.ticketing     = github            # default; alternatives: notion | jira
findings.ticketTarget  = <the project repo>  # + optional GitHub Project board
findings.slackChannel  = <#channel | null>   # GitHub Slack app or Slack connector
findings.gate          = high+              # high+ opens issues + notifies; medium/low batch to the register
```

Findings become **GitHub Issues filed as Bugs** (Bug issue type + `bug` label) in the
project repo, created via `gh` from Claude Code (works on a private repo, no MCP). Labels:
`finding` + `bug` + type (`a11y` / `brand` / `token` / `consistency`) + `sev:*`. The issue
form is `.github/ISSUE_TEMPLATE/finding.yml`. The local register mirror is
`findings/findings-register.md`; payloads are written to `findings/tickets/`.

Before filing anything, check the register and the board for an existing entry — findings
are deduplicated by class, not by sighting. Anything listed in
`knownFalsePositiveClasses` is never filed again.

## Code handover (the developer works mainly in OutSystems)

Generated code (CSS, Web Component `.js`, Block instructions) is **not** the end of the
chat — it is handed over as a **GitHub issue filed as a Task and assigned to the
developer**, who adds it into OutSystems themselves. Label `handover` + `task`; form at
`.github/ISSUE_TEMPLATE/handover.yml`; bodies live in `handover/`.

**Rule: the handover ticket must CONTAIN the JS/CSS to copy into ODC — not just point at a
repo path.** Every `handover/*.md` carries a `## Code to paste into ODC` section with the
verbatim artifact(s) in a collapsed `<details>` block (source path in the `<summary>`).
Tokens travel via `dist/tokens.css` as their own paste, so they are not duplicated there.
Embed only what the developer hand-places: block CSS overrides and Web Component `.js`. The
blocks are generated from source by `node build/embed-handover-code.mjs` (idempotent) —
re-run it after editing a handed-over source file, and add new handovers to its `MAP`.

**Rule: every handover also carries a `## Build in ODC with Mentor Studio` section** — a
ready-to-paste prompt for **ODC Mentor Studio** that scaffolds the OutSystems side (Block,
attribute bindings, event wiring, Client Actions). Mentor is a logic/data agent: it does
*not* author the CSS or the Web Component, so the prompt fences those off as already-pasted
and aims Mentor only at the wiring. `embed-handover-code.mjs` generates it too —
archetype-aware by default (Web Component / native-widget restyle / Style-Guide reference),
or fully filled when the `MAP` entry supplies a `mentor` spec. The reusable template is
`handover/MENTOR-STUDIO-PROMPT.md`.

```bash
gh issue create --title "[handover] <component> — add in OutSystems" \
  --body-file handover/<artifact>.md --label "handover,task" --type "Task" \
  --assignee @me --repo <owner/repo from project.config.json>
```

Findings (bugs) and handovers (tasks) live on the same GitHub **Project** board — a kanban
with a `Status` column. Only board-**Approved** items reach an OutSystems build.

## Build pipeline

- Source tokens live in `tokens/` (`colors.css`, `spacing.css`, `typography.css`, plus the
  semantic, utility, per-component and OutSystems-UI-override layers).
- `npm run build:theme` → **two ODC pastes**:
  **`dist/tokens.css`** — the design tokens ONLY (the single consolidated `:root` plus
  device-scoped token redefinitions like `body.phone` type steps) — and
  **`dist/theme.css`** — everything else (`@font-face`, base rules, utility classes,
  widget/component overrides; NO tokens). Paste **both** into the ODC Theme editor;
  a token-only change then means re-pasting only `dist/tokens.css`.
  Assembled by `build/build-theme.mjs` (comment-preserving), which lifts every file's
  `:root` into ONE consolidated block and prepends an **OutSystems-UI-style Table of
  Contents + section banners** to EACH file, keeping the source provenance/finding
  comments. **Rule: both dist files must always carry that TOC + sectioning** — never ship
  a flat, comment-stripped theme. Section order follows the `@import` order in
  `tokens/index.css`; each file declares its own place with a `/* @section Group / Name */`
  header (and an optional `@kind branding|foundation|component`), so there is no table to
  keep in sync.
- **Token change report (every build):** the assembled token set is diffed against the
  committed baseline `tokens/tokens.lock.json`; added/modified/removed tokens are printed
  classified **branding** (palette, semantic roles, framework retints) / **foundation**
  (spacing, type, radius, border, shadow) / **component**, and recorded newest-first in
  `tokens/TOKEN-CHANGELOG.md`. A design system's tokens are its public API — a rename that
  lands silently is a breaking change nobody reviewed. Both files are generated **and
  tracked**: commit them with the token change; never edit them by hand. The first build of
  a new project seeds the baseline instead of reporting every token as added.
- `npm run check:live-theme` → diffs the **live** ODC theme against a fresh local build, so
  the manual copy-paste can be shown to be current. Exit `0` in sync / `1` drift / `2` live
  unreachable, and `0` with "not configured" until the `odc` block in `project.config.json`
  is filled in. See `loop/ROUTINES.md` §4 for the scheduled version.
- `npm run build:theme:ship` → the **customer deliverable**: the same two files with
  ordinary `/* … */` provenance/finding notes stripped, keeping the `/*!` head, Section
  Index and section banners (so they still satisfy the rule above). Re-run `build:theme` to
  restore the commented dev copy.
- `npm run watch:theme` for live rebuilds while iterating.
- `npm run build:theme:min` → `dist/theme.min.css` via lightningcss. Optional; strips
  comments, so it is **not** a file pasted into ODC.
- The theme version is the `version` in `package.json`, stamped into both dist files. See
  `RELEASING.md`.

### Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install build deps. |
| `npm run init` | Fill in `project.config.json` and substitute every `<<PLACEHOLDER>>` across the scaffold. Run once per engagement; re-runnable. |
| `npm run check:config` | The drift guard. Fails if a placeholder survives, if the example prefix `acme-` leaked into real code, or if a convention is malformed. Runs automatically before `build:theme`. |
| `npm run build:theme` | Assemble `tokens/*.css` → `dist/tokens.css` (design tokens only, single `:root`) + `dist/theme.css` (classes/overrides, no tokens), both commented + TOC'd. Paste BOTH into ODC. Also diffs the token set vs `tokens/tokens.lock.json` and logs branding/foundation/component changes to `tokens/TOKEN-CHANGELOG.md`. |
| `npm run check:live-theme` | Diff the LIVE ODC theme against a fresh local build. Exit 0 in sync / 1 drift / 2 unreachable; 0 + "not configured" until `project.config.json`'s `odc` block is filled in. |
| `npm run build:theme:ship` | Customer deliverable: both files with ordinary comments stripped, `/*!` TOC + banners kept. |
| `npm run build:theme:min` | Minified `dist/theme.min.css` (not for ODC paste). |
| `npm run watch:theme` | Rebuild the theme on token changes. |
| `npm run gen:color-utilities` | Generate `.background-*` / `.text-*` utility classes. |
| `npm run gen:type-utilities` | Generate `.font-size-*` / `.font-weight-*` classes. |
| `npm run gen:spacing-utilities` | Generate directional margin/padding classes. |
| `npm run build:osui` | Compile the vendored OutSystems UI submodule → `preview/vendor/outsystems-ui/outsystems-ui.css` (the preview's real OSUI base). |
| `npm run preview` | Zero-dep static server serving `preview/index.html` over `http://` for the local component preview. |
| `node build/embed-handover-code.mjs` | Idempotently embed source CSS/JS into the `handover/*.md` "Code to paste into ODC" blocks. |

The `gen:*` outputs are **generated** — edit the generator in `build/`, not the emitted
`tokens/*-utilities.css`.

**Opt-in add-on: the icon-font pipeline.** A project that self-hosts a licensed icon font
(e.g. FontAwesome Pro) enables the scripts under `build/optional/fontawesome/` and wires
them into `package.json`. Two rules survive from the project that built it: never declare a
font-family name that the framework's own icon widget already owns (redeclaring it clobbers
the native widget), and never commit the licensed assets or vector artwork — see
`vendor/LICENSING.md`.

There is no separate test or lint step. The deterministic build gate plus the `checker`
agent are the validation gate, by design.

## Hard rules

1. Never edit the OutSystems UI module or the vendored submodule — build on top of it.
2. Never validate in Service Studio Preview alone — publish and test in a real browser.
3. Never hard-code design values — always `var(--token)`. A value with no token is a
   `design-token` finding.
4. Never silently substitute a brand color/value/token for accessibility — flag it.
5. Never drop a finding to avoid friction — log it at minimum.
6. For custom components: vanilla JS Web Components only (no Lit/Stencil/React).
7. Never attach classes by mutating OutSystems UI internals — use `ExtendedClass`.
8. Never restate a project value that lives in `project.config.json` — read it.
9. Never enforce a convention whose `status` is not `confirmed`.

## Architecture map

The repo turns Figma designs into three OutSystems-pasteable artifacts: **theme tokens**,
**block CSS overrides**, and **Web Component JS**.

**Token layering (`tokens/`).** `tokens/index.css` is the single `@import` manifest and the
order is load-bearing: primitives (colors, spacing, typography, radius, border, shadows) →
the semantic role layer → generated utility classes → per-component token files →
**OutSystems UI overrides LAST** (`outsystems-ui-overrides.css` and friends) so their
`:root` redefinitions win over the framework defaults. `build/build-theme.mjs` consolidates
every `:root` into one block, keeps comments, prepends the TOC, and splits the result into
`dist/tokens.css` (definitions) + `dist/theme.css` (classes/overrides). When you add a token
file, add it to `index.css` and give it a `/* @section Group / Name */` header — the section
metadata is self-declared in the file, so there is no second place to forget.

**`src/` — two delivery shapes.**
- `src/blocks/*.css` — BEM `ExtendedClass` overrides that **restyle native OutSystems UI
  widgets** (button, dropdown, switch, text field…). Prefer overriding the native
  `.btn`/`.dropdown`/etc. classes over building a parallel system. Handed over as paste-in
  CSS.
- `src/components/*.js` (+ matching `.css`) — vanilla JS **Web Components** for L5 builds
  that do not exist in OutSystems UI, plus the Live Style Guide reference components. No
  Lit/Stencil/React.

**Local preview (`preview/`).** `preview/index.html` is the Live Style Guide harness with
three layers: (1) the **real** compiled OutSystems UI CSS (`npm run build:osui`), (2) the
two theme pastes (`dist/tokens.css` then `dist/theme.css`, in that order), (3) the `src/`
overrides + Web Components. The preview chrome must stay token-only and class-only — no
inline styles, no ad-hoc hex. Serve it with `npm run preview` and validate in a real
browser; never trust Service Studio Preview for Web Components.

This harness is not a convenience — **it is the fidelity gate the checker measures**. Every
`src/blocks/*.css` must be `<link>`ed here in layer order; a stylesheet that is not loaded
means the preview proved nothing, and the component was never actually reviewed.

**The design loop (`loop/` + the plugin).** `/outsystems-loop:design-loop` (or
`./loop/run.sh`) drives an autonomous Figma → OutSystems loop defined by `loop/goal.md`.
Per component: **`@outsystems-loop:maker`** builds one artifact faithfully →
**`@outsystems-loop:checker`** independently validates it and returns PASS/FAIL. On PASS the
orchestrator commits, opens a handover Task, and updates the Style Guide. State is resumable
via `loop/state.json`; `loop/REPORT.md` summarizes the run.

The **spec of record** is the frozen Figma snapshot at `loop/refs/<item-id>/` (`spec.md` +
`variables.json` + `figma.png`). The orchestrator snapshots it via the Figma MCP **before**
the maker runs, because subagents have no Figma access. Both maker and checker judge against
that ref, never live Figma — and **no ref means the item goes `needs-human`, never built**.

**The agentic-review gate (lean, single checker).** The `checker` is this project's code
review, and it runs in this order:
1. **Deterministic gate (hard wall):** `npm run build:theme` must exit 0 — which means
   `check:config` must pass first — before any subjective judgment. A broken build or an
   unfilled config is an instant FAIL.
2. **Rendered-fidelity gate (hard wall):** the checker serves the preview and measures the
   **computed** style of every value the frozen ref states, returning a MEASUREMENTS table
   and `VISUAL: pass | drift | unverified`. Drift or unverified forbids a PASS. A correct
   declaration in our source proves nothing — framework and provider CSS out-specify it and
   win silently, so fidelity is what was measured, never what was read.
3. **Risk-tiered depth:** scrutiny scales to blast radius. `trivial` (utility, config) gets
   a glance; `core` (L5 Web Components, interactive composites) gets the full stack.
4. **Adversarial finding challenge:** every finding must survive a refutation against *real
   rendered usage* before it is filed. Refuted ones are recorded as `not-reproduced` in the
   register and never become bugs. Never flag against an unconfirmed convention. This
   challenge applies to **findings only** — measured drift is a fact about the build, not a
   claim to refute; it goes back to the maker, not to a designer.
5. **Decision-log capture:** maker and checker emit their reasoning, alternatives ruled out,
   and assumptions; these persist to `state.json` and the handover, so the human reviewer is
   not reconstructing intent.
6. **Review metrics:** `loop/REPORT.md` carries a `## Review metrics` block each run
   (auto-pass vs needs-human, findings filed vs challenged-out, rounds, tier coverage,
   deterministic-gate pass rate, and **rendered-fidelity coverage** — the only one of these
   that reflects whether the build looks like the design).

**Two GitHub outputs.** Design conflicts become **findings** (Bug issues, mirrored in
`findings/findings-register.md`). Generated code becomes **handovers** (Task issues, bodies
in `handover/*.md` with the verbatim code embedded).

**Vendored references.** `vendor/outsystems-ui/` is the OutSystems UI git submodule — the
source of truth for real rendered widget DOM/SCSS when designing an override. Read it; never
edit it. Pin it to the OutSystems UI version your target ODC environment actually runs.
`outsystems-widgets-reference/` holds captured real rendered widget HTML to anchor a restyle
on, because vendored SCSS can be stale. Licensed vendor assets follow `vendor/LICENSING.md`.

**Other directories and root docs.** `style-guide/` (Live Style Guide page sources),
`design/` (brand guidelines + Figma links = the brand source of truth), `docs/` (incl.
`docs/meetings/` and `docs/LESSONS.md`). Root docs worth knowing: `GETTING-STARTED.md`
(setup runbook), `WORKFLOW.md` (how a piece of work moves end to end), `RELEASING.md`,
`project-context.md` (the human prose companion to `project.config.json`), and
`CHANGELOG.md`.
