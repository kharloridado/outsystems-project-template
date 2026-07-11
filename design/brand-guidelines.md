# Brand Guidelines — <<DESIGN_SYSTEM_NAME>>

The source of truth for brand conformance. Findings reference this file, and the loop reads it. Fill it in at kickoff; leave a field blank rather than guessing — a plausible-looking default that nobody confirmed becomes a rule the checker enforces, and manufactures false findings against real design work.

## Color palette

The brand colors. Build to these exactly; never re-shade one to pass a contrast check.

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#______` | |
| `--color-secondary` | `#______` | |
| | | |

> A color in the design that is not listed here is a `brand` finding. Do not add to the palette without the brand owner's sign-off.

## Typography

- Font family: `______`
- Weights in use: `______`
- Type scale: see `tokens/typography.css`.
- Device axis: `<does the type scale change per device/breakpoint? if yes, say so here — a size that varies by mode must be per-breakpoint tokens, not one shared token>`

## Spacing

- Base / grid: `<confirmed value, or "TBD — not confirmed">`
- Scale: see `tokens/spacing.css`.

> If the base is TBD, it is **not a rule**: the checker must not enforce it, and "off the grid" is not a finding. Promote it to a confirmed value here (and in `project.config.json`) only when the designer has actually said so.

## Iconography

- Icon font / set: `______`
- Sizes and weights in use: `______`
- Rule: `<inline SVG vs font glyphs — state which, once, so components don't diverge>`

## Logo and elevation

`<clear-space rules, permitted lockups, the shadow/elevation scale and where each step is used>`

## Known signed-off exceptions

**Approved deviations go here.** This is the only place the loop looks for them.

An exception recorded here is not re-flagged. An exception that lives only in a meeting note, a Slack thread or a closed issue does not exist as far as the loop is concerned — the checker will raise it again on the next run, and every run after that, and a human will spend time refuting the same finding forever. When the brand owner or designer signs off on a deviation, write the row before the session ends.

| Deviation | Where it applies | Approved by | Date | Why it is not a finding |
|---|---|---|---|---|
| `<e.g. brand blue used as link text despite 3.02:1 contrast>` | `<component / token / scope>` | `<name, role>` | `<yyyy-mm-dd>` | `<the decision, in one line>` |
| | | | | |
