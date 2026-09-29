# OutSystems design-system project template

Start every OutSystems engagement here. Figma designs in, three ODC-pasteable artifacts out: the
**theme** (`dist/theme.css`), **block CSS** that restyles native OutSystems UI widgets, and
**vanilla JS Web Components**. Every build is reviewed as a published Artifact: a demo of the
component beside the Figma frame, its measured values against the judged baseline, findings, and
the code to paste into ODC.

The layout follows [Expose your design system to LLMs](https://hvpandya.com/llm-design-systems):
decisions live where an AI reads them before it writes UI code.

| Layer | Where | What keeps it honest |
|---|---|---|
| Spec files | `specs/` — foundations, decisions, one usage spec per component beside its frozen Figma ref | `npm run sync` flags specs that drift from code, tokens or Figma |
| Token layer | `tokens/` → generated `specs/tokens/token-reference.md` | the theme build validates every `var()` |
| Audit | `npm run audit:tokens`, the fidelity gate | zero hard-coded values; every item re-measured on every push |

Behaviour — the maker/checker loop and the skills — is the
[`outsystems-loop`](https://github.com/kharloridado/outsystems-loop) Claude Code plugin (3.x).
Project values live in `project.config.json`. Rules for Claude live in `CLAUDE.md`.

## Start a project

1. **Use this template** on GitHub to create the project repo, and clone it.
2. In Claude Code, run `/outsystems-loop:project-setup`. It fills `project.config.json` (and
   every `<<PLACEHOLDER>>` through `npm run init`), wires the plugins, the ODC MCP server and
   the Figma connector, creates the GitHub labels and board, and turns your deliverables list
   into the loop's queue.
3. Then:

```bash
npm install
git submodule update --init vendor/outsystems-ui
npm run build:osui
npm run build:theme
```

4. Write `specs/foundations/` from the brand guidelines and Figma library, and fill the
   environment sections of `specs/foundations/platform.md`.

Build a component with `/outsystems-loop:design-loop` (or `board-advance` in board mode); review
it from the Artifact link on its PR.

Release notes for this template: [`CHANGELOG.md`](./CHANGELOG.md).
