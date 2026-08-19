---
name: mobile-ui-router
description: Entry point for Mobile UI work (ODC Mobile UI Template — Ionic+React widgets, separate from OutSystems UI). Routes to the right doc based on task — orient on the framework, look up a widget property, theme via design tokens. Use this BEFORE loading specific files.
---

# Mobile UI — Router

You're using **Mobile UI** (ODC Mobile UI Template). This is a separate stack from OutSystems UI — Ionic+React widgets, not block patterns. Pick the topic; **load one file at a time**.

> If you're actually on Reactive Web or Phone App Template, switch to [`../outsystems-ui/SKILL.md`](../outsystems-ui/SKILL.md). The two stacks have completely different building blocks (widgets vs patterns) — guessing wrong wastes the most tokens.

## Task → file

| Task | Load |
|---|---|
| Orient on the framework, widget catalog, property model, two-repo architecture | [`README.md`](README.md) |
| Theme the app / pick a token / override for branding or dark mode | [`../../foundations/outsystems-design-tokens/design-tokens.md`](../../foundations/outsystems-design-tokens/design-tokens.md) |
| Look up the exact properties / events / placeholders of a specific widget | The TypeScript source of truth is `src/generated/<Widget>.Generated.ts` in [OutSystems/runtime-mobile-widgets-js](https://github.com/OutSystems/runtime-mobile-widgets-js/tree/main/src/generated) — read the relevant generated interface. |

## Cross-cutting concerns

If the task is mainly about a11y, performance, CSS customization, responsive design, or atomic-design composition decisions → go to [`../../common/SKILL.md`](../../common/SKILL.md).

## What's different from OutSystems UI

Don't carry over assumptions:

| Concern | Mobile UI | OutSystems UI |
|---|---|---|
| Building blocks | **Widgets** (`Button`, `Modal`, `Card`, …) | **Patterns** (`UIBlockInstanceWidget` like `Sidebar`, `BottomSheet`) |
| Property model | TypeScript interfaces, camelCase (`isOpen`, `hasBackdrop`) | OutSystems block arguments, FULL PATH (`Card.UsePadding`) |
| Theming | **Design tokens** (`var(--token-*)`) | Framework's own CSS variables (`var(--color-primary)`) |
| Modal | `Modal` widget (header/content/footer placeholders) | `Popup` built-in widget |

If you find yourself reaching for OutSystems UI patterns / blocks-index / `Set<Provider>Configs` Client Actions while on Mobile UI, stop — those don't apply here.

## What NOT to load

- `ui-frameworks/outsystems-ui/*` — wrong stack.
- The full token catalog when you only need one token name — `design-tokens.md` is ~250 lines.
- The runtime-mobile-widgets-js generated TypeScript — read only the specific widget's `.Generated.ts` file when you need its property list.

## Token budget shape

```
outsystems-agents/SKILL.md        ← ~80 lines
  ↓
this SKILL.md                     ← ~50 lines
  ↓
ONE leaf doc OR ONE generated TS interface
```
