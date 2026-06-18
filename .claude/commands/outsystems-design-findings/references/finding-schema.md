# Finding Schema

The canonical structure for a design-conformance finding. Keep findings small and atomic — one conflict per finding.

## ID scheme

`FND-NNN`, sequential per project, starting at `FND-001`. Never reuse an ID even after a finding is closed. The current high-water mark lives at the top of `findings/findings-register.md`.

## Fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `FND-NNN` |
| `type` | yes | `accessibility` \| `brand-color` \| `design-token` \| `consistency` |
| `code` | yes | sub-code, see below |
| `severity` | yes | `blocker` \| `high` \| `medium` \| `low` |
| `location` | yes | screen / component name + Figma node id if known |
| `observed` | yes | the exact as-designed value (color hex, px value, ratio) |
| `rule` | yes | the violated rule (WCAG SC, "not in palette", "no matching token") |
| `recommendation` | yes | suggested resolution **for the designer/brand owner** — advice only |
| `disposition` | yes | `open` \| `acknowledged` \| `accepted-as-designed` \| `fixed-in-design` \| `waived` |
| `impl_note` | yes | what was actually built (must be faithful to the current design) |
| `ticket_ref` | no | URL/key once a ticket is opened |
| `created` | yes | ISO date |

## Sub-codes by type

- **accessibility**: `contrast`, `target-size`, `focus-obscured`, `focus-appearance`, `no-keyboard-alt-for-drag`, `consistent-help`, `redundant-entry`, `accessible-auth`
- **brand-color**: `off-palette` (color not in brand set), `near-palette` (close to a brand color but not exact)
- **design-token**: `no-token` (hard-coded, no match), `near-token` (close to scale, e.g. 18px vs 16/24), `new-token-needed` (legit new value worth adding)
- **consistency**: same as the accessibility flow-level codes when found at screen/flow level

## Severity rubric

- `blocker` — body/UI text contrast clearly fails (< 3:1); interactive element with no accessible path at all.
- `high` — definite WCAG AA failure on a primary surface (e.g., primary button label 3.8:1); off-palette color used as a primary brand element.
- `medium` — passes large-text contrast only; near-token miss; off-palette color in a minor accent.
- `low` — cosmetic drift, single-use value, polish.

## Register table format

`findings/findings-register.md` uses exactly these columns:

```markdown
# Findings Register — <Customer> / <Project>
> Next ID: FND-004

| ID | Type | Sev | Location | Observed | Rule | Recommendation | Disposition | Ticket |
|---|---|---|---|---|---|---|---|---|
| FND-001 | accessibility/contrast | high | Login / Primary CTA (node 12:48) | #1A73E8 text on #5B8DEF bg → 1.9:1 | WCAG 2.2 SC 1.4.3 | Darken CTA bg to #1B4FB8 (4.6:1) or use white label | open | — |
| FND-002 | brand-color/off-palette | medium | Dashboard / status chip | #2ECC71 | Not in brand palette (nearest --color-success #16A34A) | Confirm intended; snap to --color-success or add token | open | — |
| FND-003 | design-token/near-token | low | Card / padding | 18px | No matching --space-* (16 / 24) | Snap to --space-m (16px) | open | — |
```

Keep the `Observed` and `Recommendation` cells short; full detail goes in the per-finding ticket payload.

## Disposition lifecycle

```
open ──ack by designer──> acknowledged ──┬──> accepted-as-designed   (brand owner signs off on the deviation; impl stays as-is)
                                          ├──> fixed-in-design        (designer updates Figma; re-audit, then close)
                                          └──> waived                 (out of scope / won't fix this cycle)
```

When a finding moves to `fixed-in-design`, re-pull the Figma node, confirm the new value, update `impl_note`, and close.

## Implementation note rule

`impl_note` always describes the **faithful** build. Examples:
- "Built CTA exactly as designed: #1A73E8 label on #5B8DEF. Contrast finding raised; not altered pending design decision."
- "Used #2ECC71 as specified via a one-off `--rnt-chip-status` custom property; flagged for palette reconciliation."

This is what lets a reviewer trust that the code matches the mockup while the finding tracks the open question.
