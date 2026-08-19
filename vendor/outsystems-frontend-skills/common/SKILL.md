---
name: common-router
description: Entry point for cross-cutting OutSystems frontend concerns (apply to any stack — Reactive Web, Phone App, Mobile UI). Routes to a11y, performance, CSS customization, responsive design, atomic-design composition, or images/icons docs. Use this BEFORE loading specific cross-cutting files.
---

# Common (Cross-cutting) — Router

These files apply regardless of stack (OutSystems UI vs Mobile UI). Load **one at a time** based on what the task actually needs.

## Task → file

| Task | Load |
|---|---|
| Accessibility review / WCAG / ARIA / keyboard / focus management | [`accessibility.md`](accessibility.md) |
| Slow screens / pagination / lazy loading / search debouncing / aggregate optimization | [`ui-performance.md`](ui-performance.md) |
| Custom CSS / theming / dark mode / where styles belong | [`css-customization.md`](css-customization.md) |
| Responsive layout / breakpoints / phone vs tablet vs desktop | [`responsive-design.md`](responsive-design.md) |
| Composition methodology — when to extract a Block, where logic belongs | [`atomic-design.md`](atomic-design.md) |
| Images, icons, SVG, user avatars | [`images-and-icons.md`](images-and-icons.md) |

## Heuristics

- **Don't pre-load these.** Load only when the specific concern is on the table.
- **`atomic-design.md` is the most general** — it informs all UI decisions ("should this be a Block?"). Worth loading early when the task involves composition decisions, not when fixing a single screen's CSS.
- **`accessibility.md` and `ui-performance.md`** are review-style docs. Load when reviewing existing code, or when about to ship.
- **`css-customization.md` and `responsive-design.md`** are how-to docs. Load when about to write CSS or build a responsive layout.

## Stack-specific note inside cross-cutting concerns

Most cross-cutting docs are stack-agnostic, but **`css-customization.md`** explicitly distinguishes:

- OutSystems UI → framework's own CSS variables (`--color-primary`, …)
- Mobile UI → design tokens (`--token-*`)

Don't mix the two systems. The doc explains both side by side.

## What NOT to load

- All cross-cutting docs at once. They're ~150–300 lines each.
- This file when you already know which concern applies — go directly to the leaf.

## Token budget shape

```
outsystems-agents/SKILL.md        ← ~80 lines
  ↓
this SKILL.md (when concern is cross-cutting)   ← ~40 lines
  ↓
ONE concern doc                   ← 150–300 lines
```
