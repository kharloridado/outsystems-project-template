# Project Context

The human prose companion to [`project.config.json`](./project.config.json). Fill it in at
kickoff and keep it current — the loop reads it.

**This file does not restate machine values.** The class prefix, JS namespace, design-system
name, ODC theme module, repo, Figma file, findings routing, and the conventions (spacing
base, grid, breakpoints, default component size) all live in `project.config.json`, which is
the single source of truth that the build scripts and the agents read. Two files that both
"own" the prefix is exactly how the previous project ended up shipping two configs that
disagreed about it for its entire life. Values there; context, judgment and history here.

## Identity

- Customer: `<<CUSTOMER>>`
- Project: `<<PROJECT>>`
- Design system: `<<DESIGN_SYSTEM_NAME>>`
- Repo: `<<OWNER/REPO>>`
- Start date: `<YYYY-MM-DD>`
- Target environment: ODC (if this project is O11, change it here **and** in `project.config.json`)

## Brand source of truth

- Brand guidelines: `design/brand-guidelines.md`
- Figma library: `design/figma-links.md` (the file key and URL are also in `project.config.json`)
- **Designer / brand owner** — the human every finding goes back to: `<name / channel>`
- **Developer** — the human every handover Task is assigned to: `<name>`

Findings are a conversation, not a filing exercise. If nobody is named here, a finding has
nowhere to land and flag-don't-fix quietly becomes flag-and-forget.

## Framework reference — OutSystems UI

- **Source of truth for framework conventions:** [`OutSystems/outsystems-ui`](https://github.com/OutSystems/outsystems-ui),
  vendored read-only as a git submodule at `vendor/outsystems-ui`. **Pin it to the
  OutSystems UI version that your target ODC environment actually runs**, and record the
  version and the date it was confirmed:
  - Pinned version: `<vX.Y.Z>` — confirmed against the target environment on `<YYYY-MM-DD>`

  We build *on top of* the framework and never edit it (hard rule 1). Run `git submodule
  update --init` after cloning.

- **Brand inheritance — how the framework ends up wearing the customer's brand.** OutSystems
  UI declares its entire design-token system as `:root` custom properties (the foundations
  layer of the submodule's SCSS); its components resolve `var(--color-…)`, `var(--space-…)`,
  `var(--border-radius-…)` and `var(--shadow-…)` rather than literal values. So we do not
  restyle the framework — we **redefine its variables**. `tokens/outsystems-ui-overrides.css`
  points every one of those framework variables at this project's own tokens, and it is
  imported **last** in `tokens/index.css` so its `:root` block wins. Cover, at minimum:
  colour (a full retint), spacing (a 1:1 name remap), border-radius, and shadow/elevation.

  The result is the whole point of the approach: every native widget renders in the
  customer's brand with **no framework edits and no hard-coded values**, and an OutSystems UI
  upgrade does not undo the branding. This is also why restyling a native widget by
  overriding its own classes always beats building a parallel component system.

## Known signed-off exceptions

Approved deviations from the rules: accessibility conflicts the brand owner has accepted,
off-palette colours that are deliberate, values the designer has confirmed are correct as
drawn.

**Record them here.** The loop reads this file, so an exception written down here is
respected. A decision that only lives in a meeting note or a Slack thread will be re-flagged
as a bug on every run, forever — and the developer will keep re-litigating a settled
question.

One row per decision. Cite the finding ID or issue number it settles, who signed it off, and
when; an exception with no owner and no date is indistinguishable from an oversight.

| Exception | Applies to | Rationale | Signed off by | Date | Finding / issue |
| --- | --- | --- | --- | --- | --- |
| _none yet_ | | | | | |

The machine-readable sibling of this table is `knownFalsePositiveClasses` in
`project.config.json` — a class of finding that has been adversarially refuted and must
never be filed again.

## Notes

Project-specific context the loop and the next developer should know: brand quirks, naming
oddities, provider components in play (date-picker or dropdown providers), environment
constraints, anything surprising about how the Figma library is structured.

`<notes>`
