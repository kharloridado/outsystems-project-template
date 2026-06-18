---
name: outsystems-design-findings
description: Capture, classify, and route design-conformance findings discovered during OutSystems frontend work — accessibility (WCAG 2.2 AA) issues baked into the design, brand-color deviations, and hard-coded values that bypass design tokens. Use this skill whenever a design is implemented faithfully but contains conflicts that must be raised back to the designer or brand owner instead of being silently fixed in code — failing color contrast on brand colors, off-palette colors, non-tokenized values, missing-token gaps, or any situation where the design does not follow accessibility, brand, or token rules. Also use whenever the user wants to open tickets (Notion or Jira/Atlassian) or post to Slack about design issues. This is the flag-don't-fix companion to the outsystems-accessibility and outsystems-component-audit skills, and it runs at the end of Phase 1 audits and after any component build.
---

# Design Findings — Flag, Don't Fix

This skill exists because of one workflow rule the user cares about deeply:

> **Implement what the design says. Do not silently change brand colors, values, or tokens to satisfy accessibility or "tidy up" the design. When the design conflicts with accessibility, brand, or token rules, raise a tracked finding instead.**

Silently substituting a brand color to pass a contrast check produces an implementation that no longer matches the approved design — which is exactly the failure this skill prevents. The implementation stays faithful; the conflict gets surfaced to the people who own the decision (designer + brand owner) as a ticket and a Slack notification.

## When this skill runs

- **End of Phase 1 audit** — design-level findings (brand-color contrast, off-palette colors, values with no matching token). This is the main entry point.
- **After a component build** — implementation-level findings that couldn't be auto-resolved without altering the design.
- **On demand** — user says "log this", "open a ticket for that", "flag these", "send to Slack".

## Fix vs. flag — the dividing line

Not every accessibility issue is a finding. The test is: **does resolving it change a decision the designer made?**

| Situation | Action | Why |
|---|---|---|
| Missing focus ring, missing ARIA, no keyboard handler, missing label, no reduced-motion guard | **Fix silently** | Implementation detail; doesn't alter the visual design |
| Focus ring color — use the design's own brand color | **Fix silently** | Uses the design's palette, no deviation |
| Touch target smaller than 24px where layout has room to grow | **Fix silently** | No visual conflict |
| Brand color pair fails 4.5:1 contrast | **FLAG** | Fixing means changing a brand color — designer/brand owner decision |
| Color used isn't in the brand palette | **FLAG** | Brand conformance — not ours to redefine |
| Hard-coded value with no matching design token | **FLAG** | Token governance — designer should snap to scale or we add a token deliberately |
| Touch target too small but the design specifies a fixed size | **FLAG** | Enlarging changes the layout the designer specified |

When in doubt: if the fix would make the built UI look different from the approved mockup, it's a **flag**, not a fix.

## Finding types

- `accessibility` — WCAG 2.2 AA issue that is baked into the design (most often contrast). See `references/finding-schema.md` for sub-codes (`contrast`, `target-size`, `focus-obscured`, etc.).
- `brand-color` — a color in the design that isn't in the defined brand palette / token set.
- `design-token` — a value (spacing, radius, shadow, font weight, etc.) that is hard-coded with no matching token, or close-but-not-exact to an existing token.
- `consistency` — flow/screen-level WCAG 2.2 items (consistent help, redundant entry, accessible auth) that surface during audit.

## Severity

- `blocker` — ships broken or legally exposed (e.g., body text fails contrast badly, < 3:1).
- `high` — clear WCAG AA failure or definite off-brand color in a primary surface.
- `medium` — borderline contrast (passes large-text only), near-miss token (18px vs 16px scale).
- `low` — cosmetic token drift, nice-to-have.

Severity drives routing: by default `blocker`/`high` open a ticket **and** post to Slack; `medium`/`low` go to the findings register and are batched into a single digest. The project config can change this gate.

## The finding record

Every finding is recorded in the project's `findings/findings-register.md` as a row, and (if it meets the routing gate) as a ticket payload in `findings/tickets/`. Full field list and the markdown table format are in `references/finding-schema.md`. The short version of each finding:

- **ID** — `FND-NNN` (sequential per project)
- **Type** / **Severity**
- **Location** — screen / component / Figma node id
- **Observed** — the exact value as designed (e.g., `#1A73E8 on #5B8DEF → 1.9:1`)
- **Rule** — what it violates (e.g., `WCAG 2.2 SC 1.4.3`, `not in brand palette`, `no matching token`)
- **Recommendation** — the suggested resolution *for the designer/brand owner* — this is advice, not something applied to code
- **Disposition** — `open` → `acknowledged` → one of `accepted-as-designed` / `fixed-in-design` / `waived`
- **Implementation note** — what was actually built (always faithful to the current design)

## Routing (GitHub-first, connector-agnostic)

The destination is **set per project**, not hard-coded. Read it from the project's `CLAUDE.md` / `project-context.md` (fields `findings.ticketing` and `findings.slack_channel`) or from memory (`OutSystems project: findings routing = ...`). Supported destinations:

- **GitHub Issues + Projects (default).** Findings become issues in the project repo, **filed as the Bug type** (plus a `bug` label as the reliable fallback) and labeled by type/severity, optionally added to a Findings Project board. Created via the `gh` CLI in the Claude Code half of the hybrid workflow — this works on the private repo with no MCP dependency. This is the default because the code already lives on GitHub and findings stay next to it.
- **Notion** (`Notion` connector) — if a project tracks design work in Notion.
- **Jira** via the Atlassian Rovo connector — if a project already runs on Jira.

**Notifications:**
- For GitHub, the zero-connector path is GitHub's own **Slack app** subscribed to the repo/label (e.g. `/github subscribe owner/repo issues +label:finding`) — no Claude-side Slack connector required. GitHub notifications also cover it.
- If a project uses the `Slack` connector directly, post per `findings.slack_channel`.

**Connector availability:** GitHub via `gh` needs no MCP — Claude.ai generates the issue payloads, Claude Code runs `gh`. For Notion/Jira/Slack as Claude-side connectors, resolve the tool with `tool_search` first and confirm it's connected; if not, still write payloads to `findings/tickets/` and tell the user what to enable. Currently connected: Atlassian Rovo, Figma, Google Drive.

See `references/routing.md` for the exact `gh` commands, label taxonomy, the Notion/Jira payload shapes, and connector-availability handling.

## Output you produce

When this skill runs, produce, in order:

1. **Findings Register** — a markdown table of all findings for this pass (new + still-open). Use the exact columns in `references/finding-schema.md`.
2. **Ticket payloads** — one per finding that meets the routing gate, written to `findings/tickets/FND-NNN.md`, ready to push to Notion/Jira.
3. **Routing result** — either "opened ticket X + posted to Slack" (if connectors available) or "payloads written, connectors not connected — here's what to enable".
4. **A one-line summary** — e.g., "3 findings (1 blocker, 2 medium). 1 ticketed + Slack-notified; 2 batched to the register."

## What you never do

- ❌ Never edit a brand color, spacing value, radius, or any design-specified value in the implementation to make a finding go away. The finding is the deliverable, not a silent edit.
- ❌ Never drop a finding because it's inconvenient. Low severity → register, not silence.
- ❌ Never invent a brand palette or token to justify "snapping" a value — flag the gap and let the designer/brand owner decide.
- ❌ Never block the build waiting on a finding to be resolved. Implement to spec, log the finding, keep moving.

## References

- `references/finding-schema.md` — Full finding field list, ID scheme, severity rubric, register table format, disposition lifecycle.
- `references/routing.md` — Notion / Jira (Rovo) / Slack payload shapes and tool-call sequences; connector-availability handling.
