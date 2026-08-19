---
name: outsystems-agents
description: Entry point for any agent doing OutSystems frontend work. Loads minimal context first and routes to the right deeper skill based on the app type (Reactive Web / Phone App vs Mobile UI Template) and task (build a screen, extend a pattern, charts, maps, cross-cutting concerns). Use this skill BEFORE loading specific catalogs or recipes — it tells you which one applies, so you only spend tokens on what's needed.
---

# OutSystems Agents — Entry Point

You're working on an OutSystems app. **Don't load any specific catalog or recipe yet.** First identify the **stack** and **task**, then load only the file you need.

This entrypoint is intentionally short. The deeper docs are 200–500 lines each — only load them when the task calls for it.

## Step 1 — Pick the stack

| App is built with… | Load next |
|---|---|
| **Reactive Web** OR **Phone App Template** (block-based, OutSystems UI patterns) | [`ui-frameworks/outsystems-ui/SKILL.md`](../ui-frameworks/outsystems-ui/SKILL.md) |
| **Mobile UI Template** (ODC native-shell mobile app, Ionic+React widgets) | [`ui-frameworks/mobile-ui/SKILL.md`](../ui-frameworks/mobile-ui/SKILL.md) |

If you don't know yet, default to OutSystems UI — Reactive Web is the most common case and the two stacks have completely different building blocks (patterns vs widgets), so guessing wrong wastes the most tokens.

## Step 2 — Standalone components (independent of stack)

| Need | Load next |
|---|---|
| Adding charts | [`ui-components/outsystems-charts/README.md`](../ui-components/outsystems-charts/README.md) |
| Adding maps | [`ui-components/outsystems-maps/README.md`](../ui-components/outsystems-maps/README.md) |

## Step 3 — Cross-cutting concerns (apply to any stack)

These don't usually need loading upfront — only when the specific task calls for them.

| Need | Load next |
|---|---|
| Any cross-cutting concern (a11y, perf, CSS, responsive, atomic design, images) | [`common/SKILL.md`](../common/SKILL.md) — picks the right file |

## Token-budget rules

1. **Load this file first**, decide where to go.
2. **Load ONE next-level SKILL** (e.g. `outsystems-ui/SKILL.md`) — also small.
3. **Load ONE leaf doc** (e.g. `blocks-index.md`, a recipe, a pattern category) when you know what's needed.
4. Cross-cutting concerns get loaded **on demand** — don't pre-fetch.
5. If the task spans multiple categories (e.g. "build a list screen with custom CSS"), load the recipe first, then the cross-cutting concern when you actually hit it.

## What's in the repo (orientation only — don't load)

- `ui-frameworks/outsystems-ui/` — block patterns, screen templates, widget conventions, recipes, extensibility. The biggest section.
- `ui-frameworks/mobile-ui/` — separate Ionic+React widget framework for ODC mobile apps.
- `ui-components/outsystems-charts/`, `ui-components/outsystems-maps/` — standalone Forge components.
- `common/` — accessibility, performance, CSS customization, responsive design, atomic design composition methodology, images/icons.
- `foundations/outsystems-design-tokens/design-tokens.md` — token catalog (Mobile UI only — ignore for Reactive Web).
