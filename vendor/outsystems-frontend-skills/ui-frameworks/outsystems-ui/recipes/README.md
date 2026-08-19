---
name: osui-recipes-index
description: Index of OutSystems UI end-to-end recipes — paginated lists, create/edit forms, popup dialogs. Use to discover which recipe applies to a screen-composition task, or as a starting point when building a whole screen.
---

# OutSystems UI Recipes

> **What's here:** end-to-end runnable compositions for common screen patterns. Each recipe lists the entities you need, the LocalVariables, the ScreenActions, the widget tree, and the anti-patterns. Drop one in, rename, wire up.

Recipes complement the **reference** docs:

- For *what arguments a block takes* → [`../blocks-index.md`](../blocks-index.md), [`../patterns/`](../patterns/).
- For *how to assemble a whole screen* → this folder.
- For *which template archetype fits* → [`../screen-templates.md`](../screen-templates.md).

## Available recipes

### Screen-level (whole compositions)

| Recipe | When to reach for it |
|---|---|
| [`paginated-list-with-filters.md`](./paginated-list-with-filters.md) | Building a list screen — `TableRecords` + search input + dropdown filter + sortable columns + `Pagination`. |
| [`create-edit-form-screen.md`](./create-edit-form-screen.md) | One screen that handles both Create and Edit modes for a single entity record, using an Id input parameter that can be `NullIdentifier()`. |
| [`popup-modal-dialogs.md`](./popup-modal-dialogs.md) | Three popup recipes: confirmation ("Are you sure?"), lookup search, and inline form data-entry. |
| [`columns-and-cards-dashboard.md`](./columns-and-cards-dashboard.md) | Dashboard composition — `Columns*` rows of `Card` blocks with KPIs, charts, and content tiles. |
| [`gallery-with-filters.md`](./gallery-with-filters.md) | Card grid with filter chips, search, and pagination — the full `Gallery` + filter-pills + `Pagination` machine. |

### Block-instantiation (single-pattern recipes)

These exist to **prevent the agent from rebuilding a block from primitives.** When the request matches one of these triggers, load the recipe BEFORE writing widget JSON.

| Recipe | When to reach for it |
|---|---|
| [`horizontal-card-carousel.md`](./horizontal-card-carousel.md) | Horizontally scrollable card row (currency cards, product highlights). `Carousel` + `Card`. |
| [`tab-switcher.md`](./tab-switcher.md) | Tabs / segmented switcher between 2–6 sibling panels. `Tabs` + `TabsHeaderItem` + `TabsContentItem`. |
| [`sidebar-navigation.md`](./sidebar-navigation.md) | Persistent left-side nav rail. `LayoutSideMenu` + the existing `Menu` block from `Common`. |
| [`sidebar-drawer.md`](./sidebar-drawer.md) | Transient slide-out drawer / side panel (filters, cart, settings, off-canvas menu). `Sidebar` block from `Interaction` — distinct from the persistent nav rail above. |
| [`info-banner.md`](./info-banner.md) | Inline info / promo / status banner with optional action. `Alert` (persistent) or `Notification` (toast). |
| [`categories-card.md`](./categories-card.md) | Parameterized "category tile" with icon-square + title + count + footer info. Reusable block instantiated 3–6× in a Columns row. |
| [`buttons-and-clickables.md`](./buttons-and-clickables.md) | When to use `Button` vs `Link` vs `ButtonGroup`. Covers primary CTAs, icon buttons, "See all" links. |
| [`button-with-icon.md`](./button-with-icon.md) | `Button` / `Link` paired with a leading or trailing `IIcon`. |
| [`avatar-and-icon-badge.md`](./avatar-and-icon-badge.md) | `UserAvatar` and `IconBadge` for user-identity and notification-count chrome — instead of hand-rolled Containers with `border-radius: 50%`. |
| [`kpi-counters.md`](./kpi-counters.md) | KPI / stat blocks (big number + label). `Counter` inside `Columns3` / `Columns4`. |
| [`kpi-card-with-trend.md`](./kpi-card-with-trend.md) | KPI tile with delta / trend indicator (up-down arrow, success/error color). `Card` + `Counter` + small `Icon`. |
| [`chart-card.md`](./chart-card.md) | A chart wrapped in a `Card` / `CardSectioned` with title row + `OutSystemsCharts` block. |
| [`sparkline-card.md`](./sparkline-card.md) | Compact inline sparkline chart in a tile. `OutSystemsCharts.LineChart` configured for minimal chrome. |
| [`progress-card.md`](./progress-card.md) | A goal / progress tile — `Card` + `ProgressBar` (or `ProgressCircle`) + label. |
| [`transaction-list.md`](./transaction-list.md) | Banking-style transaction row list — `List` of `ListItemContent` with icon, recipient, date, amount, and conditional success/error coloring. |

## When to reach for a recipe vs a Screen Template

| Choice | Use when |
|---|---|
| **Screen Template** (e.g. `ListWithFilters`, `RequestCreation`) | Scaffolding a new screen from scratch. The template gives you a working starting point in seconds. |
| **Recipe (this folder)** | You're hand-building or heavily modifying a screen, OR the template's archetype is close but not exact, OR you need to understand *why* the template is shaped the way it is. Recipes show the wiring that templates abstract away. |

## Conventions

- **Entity placeholders** (`Sample_Request`, `Sample_Priority`, `Sample_RequestId`) match the OutSystems StyleGuide sample data. Replace throughout when adapting.
- **Step-by-step structure** — every recipe runs LocalVariables → Aggregates → ScreenActions → Widget tree → Variations → Anti-patterns. Read top-to-bottom on first use; jump straight to "Variations" or "Anti-patterns" when iterating.
- **FULL PATH parameter format** for OutSystems UI block arguments (`"Pagination.MaxRecords"`, `"Tabs.OnTabChange.ActiveTab"`). Bare names are legacy.
- **Real working code** in the JSON examples — copy, rename, adapt. Continuation markers (`/* … */`) only where the omitted part repeats the pattern just shown.

## Adding a new recipe

A composition is recipe-worthy when:

- It involves **3+ widgets/patterns** working together with shared state.
- It's reused (or *should* be reused) across **multiple screens**.
- The wiring is non-obvious — e.g. needs specific event handlers, aggregate bindings, or LocalVariables to function.
- A junior developer would benefit from seeing the whole composition in one place.

Don't recipe-fy things that are already a single block (those live in `patterns/`). Don't recipe-fy a one-off screen that doesn't generalize.

**Template for a new recipe:**

```markdown
# Recipe — <Name>

> **Goal:** <one-sentence description of what this recipe builds>

## What you'll build

<ASCII tree of the resulting widget hierarchy>

## Required entity assumptions

<List the entities, attributes, and any server actions the recipe depends on. Use Sample_* names.>

## Step 1 — LocalVariables

<Table>

## Step 2 — Aggregates

<Per-aggregate spec: Fetch, MaxRecords, Sources, Joins, Filters, Sorts>

## Step 3 — ScreenActions

<Pseudo-code per action: StartNode → ... → EndNode>

## Step 4 — Widget tree

<JSON snippets, can be split per region (header/main/footer)>

## Variations

<Optional alternative shapes: debouncing, multi-step, etc.>

## Anti-patterns

<Common mistakes specific to this composition>

## Related

<Cross-links to relevant pattern reference and other recipes>
```
