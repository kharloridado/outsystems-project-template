---
name: osui-framework-overview
description: OutSystems UI framework overview — themes, layouts, screen templates, patterns. Use when starting work on any OutSystems Reactive Web app or Phone App Template screen, to orient on what the framework provides before diving into specific blocks or recipes.
---

# OutSystems UI Framework

> **Asset:** OutSystems UI
> **Type:** UI framework (built into ODC; available as module in O11)
> **Scope:** Reactive Web Apps and Mobile Apps
> **Last Updated:** 2026-05-04

## What it is

OutSystems UI is the official UI framework that ships with every OutSystems Reactive Web app and the Phone App Template. It provides four things developers use directly:

1. **Themes** — visual language (colors, typography, spacing, radii) defined as CSS custom properties on `:root` and shared utility classes.
2. **Layouts** — page-level structural Blocks with placeholders (header, menu, content, footer).
3. **Screen Templates** — pre-built screens (List, Detail, Form, Dashboard, Empty, etc.) the scaffolding wizard uses.
4. **Patterns** — drag-and-drop UI components (Accordion, Tabs, Carousel, Sidebar, …). See [`patterns/`](./patterns/).

Everything is responsive by default. Adaptive behavior (different output per device class) is opt-in via Adaptive patterns.

> **Tokens vs framework variables:** OutSystems UI uses **its own CSS variables** defined on `:root` (e.g. `--color-primary`, `--border-radius-soft`). It does **not** ship the [design tokens](../../foundations/outsystems-design-tokens/design-tokens.md) system — that lives in [Mobile UI](../mobile-ui/). Don't expect `var(--token-*)` to work in an OutSystems UI app.

## When an agent should reach for OutSystems UI

**Always.** Before writing a custom Web Block, custom CSS, or a JavaScript widget, check if a pattern, layout, or screen template already covers the use case. The framework exists to keep apps consistent and accessible without writing raw HTML/CSS/JS.

Rules of thumb:

- **Building a screen?** Start from a Screen Template (List, Detail, Form…), don't compose from blank.
- **Need a UI element?** Use a Pattern (see [`patterns/`](./patterns/)). Don't reimplement common elements like tabs, accordions, modals.
- **Need spacing, colors, typography?** Use OutSystems UI utility classes (`margin-top-base`, `text-primary`, `font-size-h2`, …) or reference the framework's CSS variables (`var(--color-primary)`, etc.). Don't hardcode values.
- **Need responsive behavior?** Prefer the existing Adaptive patterns (Columns2–6, DisplayOnDevice, MasterDetail) over media queries.

## Themes

A Theme defines the look and feel applied across an app: layouts available, default styles, CSS variable values, and shared CSS.

**Key facts:**

- Each module has a default Theme; UI Flows and Screens inherit it. Override per-screen via the Screen's `Style Sheet` property only when truly necessary.
- The default Theme references the OutSystems UI base Theme. Customize by editing the module's Theme stylesheet — *do not* edit `OutSystemsUI` directly.
- Theme stylesheets are global. Anything you write there leaks across every screen. Prefer scoped Block styles or screen-specific styles.
- OutSystems UI exposes its own **CSS custom properties on `:root`** (e.g. `--color-primary`, `--space-base`, `--border-radius-soft`). Override them in your Theme stylesheet to rebrand without forking the framework. Inspect the framework's `_root.css` (or browser DevTools) for the canonical variable names.

**Anti-patterns:**

- Pasting raw color hex codes into Theme CSS instead of overriding the framework's CSS variables.
- Treating OutSystems UI as if it used design tokens — `var(--token-*)` references won't resolve. Tokens are a Mobile UI concept.
- Setting global `*` selectors or broad element selectors that fight OutSystems UI defaults.
- Using `!important` to win specificity battles. Almost always means the override is at the wrong level.

## Layouts

A Layout is a Block placed at the root of a Screen. It defines page structure via named Placeholders that the Screen fills.

**Common built-in layouts** (names match what appears in the Toolbox):

| Layout | Use for |
|---|---|
| `LayoutTopMenu` | Standard apps with a top header and (optionally) a top nav. |
| `LayoutSideMenu` | Apps with a persistent sidebar menu (admin-style backoffices). |
| `LayoutBlank` | Empty shell when you need full control of structure. |
| `LayoutNative` (mobile) | Mobile app shell with bottom bar / native chrome. |

**Placeholders inside layouts** vary by layout but typically include: `Header`, `Menu`, `Content`, `Footer`, and sometimes `ActionsRight`, `Breadcrumbs`, `MainContent`. Drop your screen content into the right placeholder rather than overriding the layout.

**Picking a layout:**

- If the app has a sidebar nav → `LayoutSideMenu`.
- If the app has a top nav and pages scroll → `LayoutTopMenu`.
- For login, signup, error, marketing → `LayoutBlank`.

## Screen Templates

Screen Templates are pre-built Screens you scaffold from. They include layout, patterns, sample data, and the typical actions for that screen archetype.

**Common templates:**

- **List** — searchable, sortable, paginated list with filters and an empty state.
- **Detail** — read-only detail view of a single record.
- **Form / Edit** — create/edit form with validation and save/cancel actions.
- **Dashboard** — KPI tiles + charts grid.
- **Empty** — minimal scaffold (a layout and an empty content area).
- **Login / Signup / Reset Password** — auth flows wired to platform identity.

**Guidance for agents:**

- When the user says "create a screen for X," map X to the closest archetype and start from that template. Don't build screens from `Empty` unless the request really is a one-off.
- Templates rely on OutSystemsUI patterns and theme classes. Keep that consistency — don't replace pattern usage with custom HTML inside a template-generated screen.
- Sample data placeholders (e.g., a hardcoded "Sample Item") must be replaced with real Aggregate/Data Action results before shipping.

## Responsive and Adaptive

OutSystems UI is responsive by default — patterns adapt fluidly to viewport width. **Adaptive** is the additional layer where behavior or rendering changes based on the device *class* (phone / tablet / desktop), determined server-side from user-agent.

**Breakpoints** (default, can be customized per Theme):

- Phone: width < 480px
- Tablet: 480px ≤ width < 1024px
- Desktop: width ≥ 1024px

**Adaptive patterns** (see [`patterns/adaptive/`](./patterns/adaptive/)):

- `Columns2`, `Columns3`, `Columns4`, `Columns5`, `Columns6` — column grids that collapse on smaller devices.
- `ColumnsSmallLeft`, `ColumnsSmallRight`, `ColumnsMediumLeft`, `ColumnsMediumRight` — asymmetric two-column layouts.
- `DisplayOnDevice` — show/hide content per device class.
- `MasterDetail` — side-by-side master/detail on desktop, drill-down on phone.
- `Gallery` — responsive grid that re-flows item count by device.

**Picking the right approach:**

- Prefer `Columns*` patterns over hand-written CSS grid for layout.
- Use `DisplayOnDevice` to hide secondary content on phones — never hide via `display: none` inline.
- When you need *behavioral* differences (different action on mobile vs. desktop), branch on `IsPhone()` / `IsTablet()` / `IsDesktop()` server actions or the equivalent client variables.

## CSS in OutSystems UI

The framework ships:

- A **base stylesheet** (the OutSystemsUI module) with reset, typography, layout, and pattern styles.
- **Utility classes** (margins, padding, text alignment, display, flex helpers) defined directly in the framework's stylesheet — e.g. `margin-top-base`, `padding-l`, `text-primary`, `display-flex`.
- **CSS custom properties on `:root`** (e.g. `--color-primary`, `--space-base`, `--border-radius-soft`, `--shadow-l`) for everything themable. Inspect the framework's stylesheet for the canonical names.

> Design tokens (`var(--token-*)`) are a separate system used by the [Mobile UI framework](../mobile-ui/) and are not present in OutSystems UI apps. See [`../../foundations/outsystems-design-tokens/design-tokens.md`](../../foundations/outsystems-design-tokens/design-tokens.md) for the Mobile UI token catalog.

**Where to put custom CSS** (in order of preference):

1. **Block style sheet** — scoped to a Block. Always the first choice for component-specific styles.
2. **Screen style sheet** — scoped to a single screen. Use when styles are screen-specific.
3. **Theme style sheet** — global. Reserve for cross-app overrides (brand colors, font choices applied as overrides of the framework's `:root` CSS variables).

See [`../../common/css-customization.md`](../../common/css-customization.md) for the full guide.

## Patterns

The largest part of OutSystems UI. Patterns are drag-and-drop Blocks with input parameters, events, and placeholders. Each category groups related patterns into one file:

- [`patterns/content.md`](./patterns/content.md) — surfaces and grouping: Accordion, Alert, BlankSlate, Card, CardItem, CardBackground, CardSectioned, ChatMessage, FlipContent, FloatingContent, ListItemContent, Section, SectionGroup, Tag, Tooltip, UserAvatar
- [`patterns/interaction.md`](./patterns/interaction.md) — overlays, inputs, gestures: ActionSheet, Animate, AnimatedLabel, BottomSheet, Carousel, DatePicker, DatePickerRange, DropdownSearch, DropdownTags, DropdownServerSide variants, FloatingActions, InputWithIcon, LightBoxImage, MonthPicker, Notification, RangeSlider, RangeSliderInterval, ScrollableArea, Search, Sidebar, StackedCards, TimePicker, Video
- [`patterns/navigation.md`](./patterns/navigation.md) — moving around: BottomBarItem, Breadcrumbs, BreadcrumbsItem, Pagination, SectionIndex, SectionIndexItem, SubMenu, Tabs, TabsHeaderItem, TabsContentItem, TimelineItem, Wizard, WizardItem
- [`patterns/numbers.md`](./patterns/numbers.md) — numeric/status: Badge, Counter, IconBadge, ProgressBar, ProgressCircle, Rating
- [`patterns/adaptive.md`](./patterns/adaptive.md) — device-aware layout: Columns2–6, ColumnsMediumLeft/Right, ColumnsSmallLeft/Right, DisplayOnDevice, Gallery, MasterDetail
- [`patterns/utilities.md`](./patterns/utilities.md) — building blocks: AlignCenter, ButtonLoading, CenterContent, InlineSVG, MarginContainer, MouseEvents, Separator, SwipeEvents, TouchEvents
For end-to-end compositions (paginated lists, create/edit forms, popup dialogs), see [`recipes/`](./recipes/). The popup-modal recipes that used to live in this folder moved to [`recipes/popup-modal-dialogs.md`](./recipes/popup-modal-dialogs.md).

For a single-page index of every block in the framework with key arguments and placeholders, see [`blocks-index.md`](./blocks-index.md).

For widget conventions (event wiring, table structure, expression bindings, style quoting), see [`widget-conventions.md`](./widget-conventions.md).

For built-in screen templates (Dashboard, List, Detail, Form, …), see [`screen-templates.md`](./screen-templates.md).

For extending patterns beyond their built-in inputs (provider configs, custom events, JavaScript API, custom wrapper Blocks), see [`extensibility.md`](./extensibility.md).

For utility classes (spacing, colors, typography, flex, shadows, border-radius), the canonical color palette, and the `:root` CSS variables for theming, see [`styles-and-utilities.md`](./styles-and-utilities.md).

## On mobile apps

OutSystems UI is the framework used by **Reactive Web apps** and the **Phone App Template** (mobile app rendered with OutSystems UI patterns).

For ODC mobile apps using the **Mobile UI Template**, the stack is different — see [`../mobile-ui/`](../mobile-ui/). Mobile UI is a separate Ionic-based widget framework, not a layer on top of OutSystems UI. Pick the right stack per app; don't mix patterns and Mobile UI widgets in the same screen.

## What an agent should not do

- **Don't build custom HTML** for elements that have a pattern. If the user asks for "tabs," use the `Tabs` pattern, not raw HTML.
- **Don't write custom JavaScript** for behavior covered by patterns (carousels, modals, dropdowns). The patterns handle accessibility, focus management, and gestures.
- **Don't override the framework's CSS variables inline.** Override them at theme scope (preferably) or screen scope.
- **Don't disable focus outlines** to satisfy a design request. Provide alternative focus styling instead — see [`../../common/accessibility.md`](../../common/accessibility.md).
- **Don't fork OutSystems UI.** If a pattern is missing functionality, wrap it in a Block or extend via additional CSS rather than copying the pattern source.

## Related

- [Mobile UI framework](../mobile-ui/) — the alternative stack for ODC mobile apps. Mobile UI is where [design tokens](../../foundations/outsystems-design-tokens/design-tokens.md) apply.
- [CSS customization](../../common/css-customization.md)
- [Accessibility](../../common/accessibility.md)
- [UI performance](../../common/ui-performance.md)
- [Responsive design](../../common/responsive-design.md)
