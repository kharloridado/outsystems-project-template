---
name: outsystems-responsive-design
description: Responsive vs adaptive design in OutSystems — breakpoints, Column patterns, DisplayOnDevice, IsPhone()/IsTablet()/IsDesktop(), safe areas, touch targets. Use when building screens that work across phone, tablet, and desktop.
---

# Responsive Design in OutSystems

> **Goal:** build screens that work on phone, tablet, and desktop without writing media queries by hand.

## Responsive vs adaptive

OutSystems uses both:

- **Responsive** — fluid layout reflows at any viewport width. Default for all OutSystems UI patterns.
- **Adaptive** — different rendering or behavior per device class (phone / tablet / desktop), determined server-side from user-agent. Opt-in via Adaptive patterns.

Use responsive for spacing, typography, grids that fluidly resize. Use adaptive when phone needs *different* content/structure (sidebar nav on desktop → bottom bar on phone) or different behavior.

## Default breakpoints

| Device class | Width |
|---|---|
| Phone | < 480px |
| Tablet | 480px – 1024px |
| Desktop | ≥ 1024px |

Breakpoints are configurable per Theme. Don't hardcode pixel breakpoints in custom CSS — use the same breakpoint tokens the framework uses.

## Use Column blocks for multi-column layouts

Don't write CSS Grid or Flexbox by hand. The Column blocks provide responsive grids that collapse on phone:

| Block | Use for |
|---|---|
| `Columns2` … `Columns6` | Equal-width columns. |
| `ColumnsMediumLeft` / `Right` | 60/40 asymmetric (wider left or right). |
| `ColumnsSmallLeft` / `Right` | 33/67 asymmetric (narrow side panel). |

All share three arguments:

| Argument | Purpose |
|---|---|
| `GutterSize` | Gap between columns. |
| `PhoneBehavior` | How columns collapse on phone (`BreakNone` keeps side-by-side, `All` stacks vertically). |
| `TabletBehavior` | Same enum, applied at tablet. |

For a typical responsive 3-up KPI row that stacks on phone:

```
Columns3
  GutterSize    = Entities.Space.Base
  PhoneBehavior = Entities.BreakColumns.All
```

See [`ui-frameworks/outsystems-ui/patterns/adaptive.md`](../ui-frameworks/outsystems-ui/patterns/adaptive.md) for full reference.

## Show/hide content per device

Use `DisplayOnDevice` (no arguments, three placeholders):

```
DisplayOnDevice
  ├─ OnDesktop → full sidebar layout
  ├─ OnTablet  → condensed sidebar
  └─ OnPhone   → collapsed top bar
```

Each placeholder renders ONLY on its target device — server-side rendering, not CSS hiding. Omit a placeholder to show nothing on that device.

**Use for:** truly different layouts per device (sidebar vs bottom bar, multi-column vs single-column hero).

**Don't use for:** simple responsive reflow — Column blocks handle that more efficiently.

## Show/hide via `Visible` and `IfWidget`

For *behavioral* differences (different action on mobile vs. desktop), branch on `IsPhone()` / `IsTablet()` / `IsDesktop()` server actions or the equivalent client variables, then use `IfWidget` or `Container.Visible`.

```
IfWidget Condition: IsPhone()
  TrueBranch:  show floating action button
  FalseBranch: show inline button row
```

`IsPhone()` is checked server-side (during render); CSS-only `display: none` hides but doesn't remove the DOM. Prefer the conditional render for heavy content.

## Adaptive patterns are responsive too

`Gallery`, `MasterDetail`, and the asymmetric column blocks adapt out of the box:

- `Gallery` — `RowItemsDesktop` / `RowItemsTablet` / `RowItemsPhone` separately configurable.
- `MasterDetail` — collapses to drill-down on phone (master pane only, then detail on tap).
- `ColumnsSmallLeft` etc. — stack vertically when `PhoneBehavior = All`.

## Spacing tokens scale with device

Margin and padding utility classes (`margin-top-base`, `padding-l`) reference design tokens that the Theme can resolve to different values per breakpoint (if the theme is set up that way). Don't hardcode pixel values — use the utility classes or token CSS variables.

## Mobile-first vs desktop-first

OutSystems UI is responsive by default; you don't need to commit to one direction. But when targeting both:

- For **mobile-first** apps (mobile is the primary use case, desktop is a bonus), set Phone-friendly defaults and use `DisplayOnDevice.OnDesktop` to add desktop-only enhancements (sidebars, multi-column expansions).
- For **desktop-first** apps (admin / backoffice apps), use Column blocks with `PhoneBehavior: All` so multi-column layouts collapse cleanly on phones, and use `DisplayOnDevice.OnPhone` to swap chrome (top nav → bottom bar).

## Safe areas (mobile, notched devices)

OutSystems UI mobile layouts apply `env(safe-area-inset-*)` automatically — content respects the notch and home indicator on iOS, gesture bars on Android. Don't override layout root padding on mobile screens unless you're also handling safe areas yourself.

For `LayoutNative` and similar mobile shells, the framework wires this up. For embedded mobile screens, the safe-area handling is inherited.

## Touch targets

WCAG recommends minimum 44×44 CSS pixels for touch targets. OutSystems UI buttons and icon links default to ≥40px height. When customizing:

- Don't shrink action buttons below the default size on mobile.
- Don't pack icon buttons close together — at least 8px gap.
- For dense tables on mobile, consider switching to a Card-based layout via `DisplayOnDevice`.

## Anti-patterns

- **Hardcoded media queries in custom CSS** when Column blocks would do.
- **Using `display: none` to hide content** when `DisplayOnDevice` (server-side) would be cheaper.
- **Multi-column layouts without `PhoneBehavior`** — they overflow horizontally on phone.
- **Treating "responsive" as "shrinks to phone"** — sometimes phones need a different layout, not a smaller one.
- **Building custom mobile and desktop screens for the same logical view** — merge into one with `DisplayOnDevice` and `IfWidget(IsPhone())`.

## Quick checklist

- [ ] All multi-column layouts use Column blocks (not custom CSS).
- [ ] Column blocks set `PhoneBehavior` to either `All` (stack) or `BreakNone` (keep side-by-side) deliberately.
- [ ] Heavy content like sidebars and dense tables have a phone-specific alternative via `DisplayOnDevice` or `IfWidget(IsPhone())`.
- [ ] Spacing and typography use token-based utility classes, not hardcoded px.
- [ ] Touch targets are at least 40px tall on mobile.
- [ ] No content is unreachable on phones (e.g., a desktop-only sidebar).

## Source

[Responsive UI - OutSystems 11 Documentation](https://success.outsystems.com/documentation/11/developing_an_application/design_ui/look_and_feel/responsive_ui/) covers the platform-level breakpoint configuration and adaptive pattern catalog.
