---
name: outsystems-agents
description: Entry point for any agent doing OutSystems frontend work on Reactive Web / Phone App apps. Loads minimal context first and routes to the right deeper skill based on the task (build a screen, extend a pattern, add charts, maps, address a cross-cutting concern). Use this skill BEFORE loading specific catalogs or recipes — it tells you which file applies so you only spend tokens on what's needed.
---

# OutSystems Agents — Entry Point

You're working on an **OutSystems Reactive Web / Phone App** screen. **Don't load any specific catalog or recipe yet.** First identify the **task**, then load only the file you need.

This entrypoint is intentionally short. The deeper docs are 200–500 lines each — only load them when the task calls for it.

> 🔑 **Block-first / template-first principle.** OutSystems UI ships dozens of pre-built blocks (Cards, Tabs, Carousel, Counter, Tag, Sidebar, Avatar, Alert, …) and a catalog of screen-level recipes (paginated lists, create/edit forms, popup dialogs). Whenever a request matches an existing block or recipe, **use it** — do not rebuild from primitive Containers + CSS. The framework's [`ui-frameworks/outsystems-ui/SKILL.md`](../../ui-frameworks/outsystems-ui/SKILL.md) enforces this principle in detail.

## Step 1 — Frontend framework

For any UI / screen work, load:

| Load | Why |
|---|---|
| [`ui-frameworks/outsystems-ui/SKILL.md`](../../ui-frameworks/outsystems-ui/SKILL.md) | The OutSystems UI framework router — picks the right file (layouts, blocks, recipes, polish checklist) per task. |

## Step 2 — Standalone components

| Need | Load next |
|---|---|
| Adding charts | [`ui-components/outsystems-charts/README.md`](../ui-components/outsystems-charts/README.md) |

## Token-budget rules

1. **Load this file first**, decide where to go.
2. **Load ONE next-level SKILL** (e.g. `outsystems-ui/SKILL.md`) — also small.
3. **Load ONE leaf doc** (e.g. `blocks-index.md`, a recipe, a pattern category) when you know what's needed.
4. Cross-cutting concerns get loaded **on demand** — don't pre-fetch.
5. If the task spans multiple categories (e.g. "build a list screen with custom CSS"), load the recipe first, then the cross-cutting concern when you actually hit it.

## What's in the repo (orientation only — don't load)

- `ui-frameworks/outsystems-ui/` — block patterns, layouts, widget conventions, recipes, extensibility, polish checklist. The main section.
- `ui-components/outsystems-charts/` — standalone Forge component.
