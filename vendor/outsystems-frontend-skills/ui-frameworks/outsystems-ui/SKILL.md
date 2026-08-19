---
name: osui-router
description: Entry point for OutSystems UI work (Reactive Web + Phone App Template). Routes to the right topic-specific doc based on task — build a screen, pick a block, generate widget JSON, scaffold from a template, extend a pattern, find a recipe. Use this BEFORE loading specific files in the outsystems-ui folder so you only spend tokens on what's needed.
---

# OutSystems UI — Router

You're using **OutSystems UI** (Reactive Web or Phone App Template). Pick the topic that matches your task; **load one file at a time**.

> Stack note: OutSystems UI uses its own CSS variables on `:root` (`--color-primary`, `--space-base`, …) — NOT design tokens. Tokens (`--token-*`) belong to Mobile UI. If you're sure you're on Mobile UI Template, switch to [`../mobile-ui/SKILL.md`](../mobile-ui/SKILL.md).

## Task → file

| Task | Load |
|---|---|
| Orient on what the framework provides (themes, layouts, screen templates, patterns) | [`README.md`](README.md) |
| Pick a block by requirement / look up its arguments / placeholders / events | [`blocks-index.md`](blocks-index.md) |
| Generate widget JSON / debug silent failures (empty widgets, ignored styles) | [`widget-conventions.md`](widget-conventions.md) |
| Scaffold a new screen from a template archetype | [`screen-templates.md`](screen-templates.md) |
| Extend a pattern beyond its built-in inputs (provider configs, custom events, JS API, wrapper Blocks) | [`extensibility.md`](extensibility.md) |
| Pick a utility class (spacing / color / typography / flex / shadow / radius) / look up a CSS variable / theme the app | [`styles-and-utilities.md`](styles-and-utilities.md) |

## Need a specific pattern? Load the matching category file

| Looking for… | Load |
|---|---|
| Cards, sections, alerts, accordion, tags, tooltips, avatars, blank state | [`patterns/content.md`](patterns/content.md) |
| Date pickers, dropdowns, sliders, sidebars, sheets, carousels, gestures | [`patterns/interaction.md`](patterns/interaction.md) |
| Tabs, wizards, breadcrumbs, pagination, timelines, app navigation | [`patterns/navigation.md`](patterns/navigation.md) |
| KPI counters, badges, progress indicators, ratings | [`patterns/numbers.md`](patterns/numbers.md) |
| Column layouts, gallery, master-detail, device-aware rendering | [`patterns/adaptive.md`](patterns/adaptive.md) |
| AlignCenter, Separator, gestures, small layout helpers | [`patterns/utilities.md`](patterns/utilities.md) |

## Building a whole screen? Load a recipe

| Building… | Load |
|---|---|
| Index of available recipes + when to reach for one | [`recipes/README.md`](recipes/README.md) |
| List screen (search + dropdown filter + sortable columns + pagination) | [`recipes/paginated-list-with-filters.md`](recipes/paginated-list-with-filters.md) |
| Create/Edit form screen (one screen, both modes, via Id parameter) | [`recipes/create-edit-form-screen.md`](recipes/create-edit-form-screen.md) |
| Modal dialog (confirm / lookup / inline form popup) | [`recipes/popup-modal-dialogs.md`](recipes/popup-modal-dialogs.md) |

## Cross-cutting concerns

If your task is mainly about a11y, performance, CSS customization, responsive design, atomic-design composition decisions, or images/icons → don't load anything in this folder yet. Go to [`../../common/SKILL.md`](../../common/SKILL.md) first.

## What NOT to load

- **All pattern category files at once.** Load only the category that matches the task.
- **`blocks-index.md` when you only need one specific block.** It's a 200+ line catalog; the per-category file usually has more detail anyway.
- **`screen-templates.md` mid-build.** It's for scaffolding decisions at the start, not mid-task.

## Token budget shape

```
outsystems-agents/SKILL.md        ← ~80 lines
  ↓
this SKILL.md                     ← ~70 lines
  ↓
ONE leaf doc                      ← 200–500 lines (load only what you need)
  ↓
optionally: ONE cross-cutting doc when actually relevant
```

If you find yourself loading 3+ leaf docs in a single task, you're probably over-fetching — re-read this router and pick the smallest set.
