# OutSystems Design-System Project Template

The scaffold for a new OutSystems frontend engagement: a token → theme build pipeline, a
local preview harness, a findings/handover workflow on GitHub, and a place for the
autonomous Figma → OutSystems loop to run.

> **Starting a project? Follow [`GETTING-STARTED.md`](./GETTING-STARTED.md).**

## The split: plugin vs scaffold

Two halves, deliberately separated.

**The behaviour — the `outsystems-loop` plugin.** The 13 OutSystems skills and the `maker` /
`checker` agents are a **versioned Claude Code plugin**, not files in this repo:

```
/plugin marketplace add kharloridado/outsystems-loop
/plugin install outsystems-loop@outsystems-loop --scope project
```

Then: `/outsystems-loop:design-loop`, `@outsystems-loop:maker`, `@outsystems-loop:checker`.

Previously every project received a *copy* of the skills. Improvements earned on a real
component never flowed back, the template went stale, and the next project silently started
from an older, worse loop. As a plugin, the loop is versioned once — bump it and
`/plugin update` reaches every project.

**The scaffold — this repo.** The build pipeline, the token layers, the preview, the GitHub
issue forms and setup scripts, the loop's goal/state/refs, and the project's own values.

**The values — [`project.config.json`](./project.config.json).** One file, read by the build
scripts (via `build/lib/project-config.mjs`) and by the agents. Class prefix, JS namespace,
design-system name, ODC theme module, repo, Figma file, conventions. **Nothing else restates
them** — the last generation typed the prefix into the agents, nine build scripts and two
markdown files, and shipped a project whose two config files disagreed about it forever.

## Quick start

```bash
npm install
npm run init          # fill project.config.json + substitute every <<PLACEHOLDER>>
npm run check:config  # the drift guard; runs inside build:theme too
git submodule update --init          # then pin vendor/outsystems-ui to your ODC env's version
./.github/setup-finding-labels.sh <owner>/<repo>
./.github/setup-project.sh <owner> <owner>/<repo> "<board name>"
npm run build:theme   # → dist/tokens.css + dist/theme.css, paste BOTH into the ODC Theme editor
npm run preview       # local Live Style Guide harness in a real browser
```

Then fill `design/brand-guidelines.md` + `design/figma-links.md`, set the goal and the
signed-off component inventory in `loop/goal.md`, and run `/outsystems-loop:design-loop`.

## Two rules worth knowing before you read anything else

**Fidelity first, flag don't fix.** The implementation always matches the approved design.
When the design conflicts with WCAG 2.2 AA, the brand palette, or the token system, it is
built faithfully and raised as a **finding** — never silently "corrected". Implementation-level
accessibility that does not change the visual design (focus rings in the design's own colours,
keyboard handlers, ARIA, semantics, reduced motion) is applied automatically.

**Conventions are three-state.** Every entry in `conventions` is
`{ value, status: confirmed | assumed | TBD }`, and **only `confirmed` is a rule**. The checker
may not raise findings against anything else. A template that ships a plausible-but-unverified
default (`spacing base: 4pt`) makes the loop manufacture false-positive bugs against it. A
credible-looking default is worse than a blank.

## Folder map

```
.
├── CLAUDE.md                 # the rules Claude follows; points at project.config.json for values
├── project.config.json       # THE source of truth for project values (npm run init fills it)
├── project-context.md        # human prose: brand owner, framework strategy, signed-off exceptions
├── WORKFLOW.md               # how one piece of work moves from Figma to published
├── GETTING-STARTED.md        # the setup runbook
├── RELEASING.md              # cutting a versioned theme build
├── CHANGELOG.md
├── package.json              # the npm scripts (init, check:config, build:theme, preview, …)
├── build/                    # the pipeline (Node, no framework)
│   ├── lib/project-config.mjs   # the ONE reader of project.config.json
│   ├── check-config.mjs         # drift guard; first step of build:theme
│   ├── init-project.mjs         # npm run init
│   ├── build-theme.mjs          # tokens/*.css → dist/tokens.css + dist/theme.css (TOC, single :root)
│   ├── check-live-theme.mjs     # diff the LIVE ODC theme vs a fresh local build
│   ├── gen-*-utilities.mjs      # generated color/type/spacing utility classes
│   ├── embed-handover-code.mjs  # embeds the real CSS/JS into handover/*.md
│   └── optional/fontawesome/    # OPT-IN add-on: self-hosted licensed icon font
├── tokens/                   # the theme source, layered; index.css is the load-bearing manifest
├── src/
│   ├── blocks/               # BEM ExtendedClass CSS that restyles native OutSystems UI widgets
│   └── components/           # vanilla JS Web Components (L5 builds only)
├── preview/                  # 3-layer local harness: real OSUI CSS → theme → src overrides
├── vendor/
│   ├── outsystems-ui/        # the OSUI submodule — read it, never edit it; pin it to your env
│   └── LICENSING.md          # policy for licensed vendor assets (scripts yes, artwork no)
├── outsystems-widgets-reference/  # captured REAL rendered widget HTML to anchor a restyle on
├── style-guide/              # Live Style Guide page sources
├── design/                   # brand-guidelines.md + figma-links.md = the brand source of truth
├── loop/                     # goal.md, state.json, refs/ (frozen Figma specs), run.sh, REPORT.md
├── handover/                 # handover issue bodies — with the code to paste embedded verbatim
├── findings/                 # findings-register.md + ticket payloads
├── src/assets/               # authored SVGs etc. destined for ODC Theme Resources (source, not dist)
├── docs/
│   ├── LESSONS.md            # what this pipeline learned the hard way; read before "improving" it
│   └── meetings/             # notes (decisions must be distilled into the active files)
├── .github/                  # issue forms + setup-finding-labels.sh + setup-project.sh
├── .claude/settings.json     # project-scoped permissions/hooks only — agents live in the plugin
└── dist/                     # build output, gitignored → tokens.css + theme.css to paste into ODC
```

## The two GitHub outputs

**Findings → Bug issues.** A design conflict is logged in `findings/findings-register.md` and,
at the `high+` gate, opened as a Bug for the designer. Never auto-fixed.

**Handovers → Task issues.** Generated code is handed to the developer as a Task that
**contains the CSS/JS to paste into ODC** — not a repo path to go and find — plus a Mentor
Studio prompt that scaffolds the OutSystems side. Both land on one Project board; only
board-**Approved** items reach an OutSystems build.
