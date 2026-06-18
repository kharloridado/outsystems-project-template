---
name: outsystems-component-audit
description: Analyze a Figma design and produce a structured component audit that classifies every UI element as (1) exists in OutSystems UI as-is, (2) exists but needs customization, or (3) needs to be built as a Web Component. Also flags brand inconsistencies and identifies design token deltas. Use this skill whenever the user shares a Figma frame/screenshot/handoff, asks "what's in this design", asks "do we have this in OutSystems UI", or wants a triage of a design before coding.
---

# OutSystems Component Audit

Phase 1 of the workflow: structured triage of a design before any code is written.

## Pre-flight

1. Check `memory_user_edits` for "OutSystems convention:" entries. If missing, invoke `outsystems-onboarding` first.
2. Use the stored prefix and conventions in all output.

## When to use

- User shares a Figma screenshot, exported frame, or design link
- User says "new design", "new handoff", "review this mockup"
- User asks which OutSystems UI patterns to use
- User asks for a customization estimate

## Inputs

1. **Visual** (screenshot, Figma frame export, or detailed description)
2. **Current Theme tokens** (read from prior conversation or memory; otherwise assume OutSystems UI defaults)
3. **Screen context** (mobile / desktop / both? page purpose?)

## Output: structured audit (5 sections, in order)

### 1. Component Inventory

Table of every distinct UI element identified. Three buckets:

| Element | Bucket | OutSystems UI Pattern / Approach | Escalation Level | Notes |
|---|---|---|---|---|
| Top navigation | ✅ As-is | `Layout Top` + `Menu` | L1-L2 | Standard usage |
| Hero card | 🎨 Customize | `Card Background` + ExtendedClass | L3 | Custom gradient overlay |
| Pricing tier toggle | 🆕 Web Component | Build `acme-pricing-toggle` | L5 | No OS UI match |
| Featured product card | 🎨 Customize | `Card` + wrap in custom Block | L4 | Reused 12+ places |

**Buckets:**
- **✅ As-is** — OS UI pattern matches; just use it
- **🎨 Customize** — Existing pattern with customization (L3 = ExtendedClass + BEM; L4 = wrap in custom Block)
- **🆕 Web Component** — No matching pattern → vanilla JS Web Component wrapped in OutSystems Block (L5)

**Important:** L5 always means Web Component now. Don't suggest "build a custom Block with HTML widgets from scratch" — that's the old approach. Web Components are the user's chosen architecture.

Reference the full OutSystems UI pattern catalog when classifying. If unsure between two patterns, propose both with trade-offs.

### 2. Brand Consistency Flags → findings

List values in the design that deviate from defined brand tokens. **Each becomes a structured finding** (`brand-color` or `design-token`) — the design is implemented as-is and the deviation is tracked, never silently "snapped".

```
Brand / token findings (design built as-is, flagged for design decision):
- FND-101 [brand-color/near-palette, medium] Heading #1A1A2E ≈ --color-neutral-9 #1E293B but not exact
- FND-102 [design-token/near-token, low] Card padding 18px (off scale — nearest --space-m 16px / --space-l 24px)
- FND-103 [design-token/no-token, medium] Custom hero shadow (not in --shadow-* scale)
- FND-104 [design-token/near-token, low] Body font weight 450 (not in standard --font-weight-* values)
```

Each finding carries a **recommendation** (advice for the designer/brand owner), which is one of:
- **Accept and add to system** — introduce a new token if it'll be reused (`new-token-needed`)
- **Snap to existing token** — designer should adjust the design
- **One-off exception** — only if truly unique

The recommendation is advice; the build stays faithful until design responds. Hand these to `outsystems-design-findings` for the register + routing.

### 3. Token Delta

New or updated tokens needed. Feeds directly into `outsystems-token-extractor`.

```
+ Add: --color-accent: #FF6B35 (new accent for badges)
+ Add: --shadow-2xl: 0 24px 48px rgba(0,0,0,0.18) (new elevation for hero)
~ Modify: --color-primary from #1A73E8 → #2563EB
```

### 4. Implementation Plan

Recommended sequence with escalation levels and skill routing:

```
Recommended order:
1. Update :root tokens                  → Phase 2 / outsystems-token-extractor
2. Hero card customization              → L3, outsystems-bem-css
3. Featured product card (custom Block) → L4, outsystems-bem-css
4. Pricing tier toggle                  → L5, outsystems-web-component
5. Document new components              → Phase 4, outsystems-style-guide-doc
6. Validate in browser                  → Phase 5
```

### 5. Findings Register

Consolidate every conflict from this audit — the brand/token findings from section 2 **plus** any accessibility findings surfaced by the `outsystems-accessibility` skill running alongside (contrast failures on brand colors, fixed-size targets under 24px, flow-level consistency issues). Present them as a single register table (columns per `outsystems-design-findings` → `references/finding-schema.md`), then hand off to `outsystems-design-findings` to write the register file and route per project config (Notion/Jira ticket + Slack for `high+`).

Key principle restated: the audit recommends and tracks; it does **not** rewrite the design. Every implementation that follows will be faithful to the mockup, with these findings carrying the open questions back to design.

## Style of analysis

- Be specific. "Looks like a card" is not useful. "Card Background pattern with custom gradient overlay, padding adjusted to `--space-l`, ExtendedClass = `acme-hero acme-hero--feature`" is useful.
- Use OutSystems UI pattern names exactly: `Carousel`, `Date Picker`, `Bottom Sheet`, `Sidebar`, `Stacked Cards`, `Tabs`, `Wizard`, etc.
- For L5 components, immediately propose the Web Component tag name (e.g., `acme-pricing-toggle`, `acme-step-indicator`).
- Don't waste lines on obvious classifications. Most components are quick wins.

## After audit completes

Offer next actions explicitly:

> "Next steps available:
> - Generate the :root update for the token deltas (Phase 2)
> - Generate BEM CSS for the hero card customization (L3)
> - Generate the pricing tier Web Component + Block wrapper (L5)
> Which would you like first?"

If the user just says "all of it" or "do everything," proceed in order without asking again.

## Reference

- `references/pattern-catalog.md` — Full OutSystems UI pattern list with descriptions
- `references/customization-decision-tree.md` — L1-L5 decision tree with Web Component routing
- `outsystems-design-findings` skill — schema for the Findings Register (section 5) and ticket/Slack routing
