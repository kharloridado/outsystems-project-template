---
name: osui-navigation-patterns
description: OutSystems UI navigation patterns — Tabs, Wizard, Breadcrumbs, Pagination, BottomBarItem, SectionIndex, Submenu, TimelineItem. Use when adding tabbed views, multi-step flows, paginated lists, breadcrumb trails, or app navigation.
---

# Navigation Patterns

> **Category:** Navigation — moving around within or between screens.
> **Module:** OutSystemsUI

Patterns covered: `BottomBarItem`, `Breadcrumbs`, `BreadcrumbsItem`, `Pagination`, `SectionIndex`, `SectionIndexItem`, `Submenu`, `Tabs`, `TabsHeaderItem`, `TabsContentItem`, `TimelineItem`, `Wizard`, `WizardItem`.

For format conventions (FULL PATH parameters, required `Arguments: []` and `PlaceholdersContent: []`), see [blocks-index.md](../blocks-index.md).

## Requirement → block

| Requirement | Block(s) |
|---|---|
| Switch between sibling views on one screen | `Tabs` + `TabsHeaderItem` + `TabsContentItem` |
| Multi-step ordered flow | `Wizard` + `WizardItem` |
| Breadcrumb trail on a detail screen | `Breadcrumbs` + `BreadcrumbsItem` |
| Page through a long list | `Pagination` (with paginated aggregate) |
| Side anchor links to scroll to sections | `SectionIndex` + `SectionIndexItem` |
| Mobile bottom-bar navigation | `BottomBarItem` (one per tab) |
| Collapsible nested menu group | `Submenu` |
| Vertical event/activity timeline | `TimelineItem` |

## Tabs + TabsHeaderItem + TabsContentItem

Tabbed switcher between 2–6 sibling content panels.

**`Tabs` arguments**

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `Tabs.StartingTab` | Integer | `0` | Zero-based index of the active tab on initial render. |
| `Tabs.TabsOrientation` | `Entities.Orientation` | `Horizontal` | `Horizontal` or `Vertical`. |
| `Tabs.TabsVerticalPosition` | `Entities.Direction` | `Left` | When vertical: `Left` or `Right`. |
| `Tabs.OptionalConfigs` | Record | `{}` | `{ JustifyHeaders: Boolean }` to stretch headers across width. |
| `Tabs.Height` | Text (CSS) | `""` | Fixed height for content area; empty = auto. |
| `Tabs.ExtendedClass` | Text | `""` | Extra CSS. |

**`Tabs` placeholders**

| Placeholder | Contents |
|---|---|
| `Tabs.Header` | One `TabsHeaderItem` per tab, in order. |
| `Tabs.Content` | One `TabsContentItem` per tab, **same order** as headers. |

**`Tabs` events**

| Event | Payload | Purpose |
|---|---|---|
| `Tabs.OnTabChange` | `ActiveTab` (Integer) | Fires when active tab changes. Pass via FULL PATH: `Parameter: "Tabs.OnTabChange.ActiveTab"`. |
| `Tabs.Initialized` | `TabsId` (Text) | Fires when the block finishes initializing. |

**`TabsHeaderItem`**

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `TabsHeaderItem.IsDisabled` | Boolean | `False` | Disables the tab. |
| `TabsHeaderItem.ExtendedClass` | Text | `""` | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `TabsHeaderItem.Title` | Tab label (text + optional icon). |

**`TabsContentItem`**

| Parameter | Type | Purpose |
|---|---|---|
| `TabsContentItem.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `TabsContentItem.Content` | The tab body. |

**Composition**

- Header item count MUST equal content item count and they must be in the same order. Index 0 of headers maps to index 0 of content.
- Programmatically switch tabs by calling `<TabsBlock>.SetActiveTab(NewIndex)` from a ScreenAction or by binding `StartingTab` to an Integer LocalVariable updated by `OnTabsChange`.
- Avoid nesting `Tabs` inside `Tabs` — restructure into separate screens or use a sidebar.
- Don't use `Tabs` for ordered/sequential steps — use `Wizard`.

**Minimal example (3 tabs)**

```jsonc
{
  "type_": "IMobileBlockInstanceWidget",
  "SourceBlock": "Tabs",
  "Arguments": [
    { "type_": "IArgument", "Parameter": "Tabs.StartingTab", "Value": "0" },
    { "type_": "IArgument", "Parameter": "Tabs.TabsOrientation", "Value": "Entities.Orientation.Horizontal" }
  ],
  "EventHandlers": [
    { "type_": "IEventHandler", "Event": "Tabs.OnTabsChange", "Handler": "!OnTabChange" }
  ],
  "PlaceholdersContent": [
    {
      "type_": "IPlaceholderContentWidget", "Placeholder": "Tabs.Header",
      "Widgets": [
        { "type_": "IMobileBlockInstanceWidget", "SourceBlock": "TabsHeaderItem",
          "Arguments": [], "PlaceholdersContent": [
            { "type_": "IPlaceholderContentWidget", "Placeholder": "TabsHeaderItem.Title",
              "Widgets": [{ "type_": "ITextWidget", "Text": "Overview" }] }
          ]},
        { "type_": "IMobileBlockInstanceWidget", "SourceBlock": "TabsHeaderItem",
          "Arguments": [], "PlaceholdersContent": [
            { "type_": "IPlaceholderContentWidget", "Placeholder": "TabsHeaderItem.Title",
              "Widgets": [{ "type_": "ITextWidget", "Text": "Activity" }] }
          ]},
        { "type_": "IMobileBlockInstanceWidget", "SourceBlock": "TabsHeaderItem",
          "Arguments": [], "PlaceholdersContent": [
            { "type_": "IPlaceholderContentWidget", "Placeholder": "TabsHeaderItem.Title",
              "Widgets": [{ "type_": "ITextWidget", "Text": "Settings" }] }
          ]}
      ]
    },
    {
      "type_": "IPlaceholderContentWidget", "Placeholder": "Tabs.Content",
      "Widgets": [
        { "type_": "IMobileBlockInstanceWidget", "SourceBlock": "TabsContentItem",
          "Arguments": [], "PlaceholdersContent": [
            { "type_": "IPlaceholderContentWidget", "Placeholder": "TabsContentItem.Content",
              "Widgets": [/* overview body */] }
          ]},
        /* … one TabsContentItem per remaining tab, same order … */
      ]
    }
  ]
}
```

## Wizard + WizardItem

Step indicator for multi-step flows. **`Wizard` is a visual indicator only** — the actual step navigation buttons live elsewhere on the screen and update a `CurrentStep` LocalVariable.

**`Wizard` arguments**

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `Wizard.IsVertical` | Boolean | `False` | Vertical step list (mobile/sidebar) vs horizontal strip. |
| `Wizard.ExtendedClass` | Text | `""` | Extra CSS. |

**`Wizard` placeholders**

| Placeholder | Contents |
|---|---|
| `Wizard.Content` | One or more `WizardItem` children. |

**`WizardItem`**

| Parameter | Type | Purpose |
|---|---|---|
| `WizardItem.Status` | `Entities.Steps` | `Past` (done) · `Active` (current) · `Next` (upcoming). |
| `WizardItem.UseTopLabel` | Boolean | Place label above icon (vs beside). |
| `WizardItem.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `WizardItem.Icon` | Step number or icon. |
| `WizardItem.Label` | Step title. |

**Composition**

- Track current step in a LocalVariable (`CurrentStep` Integer, default `1`).
- Drive each item's `Status` from `CurrentStep`:
  ```
  If(CurrentStep > N, Entities.Steps.Past,
    If(CurrentStep = N, Entities.Steps.Active,
       Entities.Steps.Next))
  ```
- Step navigation buttons (Next/Previous) update `CurrentStep` and conditionally render the relevant step content (an `IfWidget` chain on the same screen).

## Breadcrumbs + BreadcrumbsItem

Hierarchical link chain shown above the screen title.

**`Breadcrumbs`**

| Parameter | Type | Purpose |
|---|---|---|
| `Breadcrumbs.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `Breadcrumbs.Content` | One or more `BreadcrumbsItem` children. |

**`BreadcrumbsItem`**

| Parameter | Type | Purpose |
|---|---|---|
| `BreadcrumbsItem.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `BreadcrumbsItem.Title` | Link (intermediate crumb) or `TextWidget` (current page, last crumb). The separator icon between crumbs is rendered automatically by the parent `Breadcrumbs` block. |

**Composition**

- Place at the top of `MainContent` (or in the layout's `Breadcrumbs` placeholder if it has one).
- Last crumb is plain text, no link.

## Pagination

Page-through controls for a paginated `ScreenAggregate`. No placeholders — fully argument-driven.

**Arguments**

| Parameter | Type | Purpose |
|---|---|---|
| `Pagination.StartIndex` | Integer | Current offset — bind to a LocalVariable matching the aggregate's `StartIndex`. |
| `Pagination.MaxRecords` | Integer | Page size — bind to a LocalVariable matching the aggregate's `MaxRecords`. |
| `Pagination.TotalCount` | Integer expression | Total rows — bind to `<Aggregate>.Count`. |
| `Pagination.ShowGoToPage` | Boolean | Show numeric page input. |
| `Pagination.ExtendedClass` | Text | Extra CSS. |

**Events**

| Event | Payload | Purpose |
|---|---|---|
| `Pagination.OnNavigate` | `NewStartIndex` (Integer) | User clicked Prev/Next/page #. Handler must `Assign(StartIndex = NewStartIndex)` and `RefreshDataNode` the aggregate. Pass with FULL PATH: `Parameter: "Pagination.OnNavigate.NewStartIndex"`. |
| `Pagination.Initialized` | `PaginationId` (Text) | Fires when block initializes. |

**Composition**

- The aggregate MUST have `MaxRecords` and `StartIndex` set to LocalVariables (not literals) so refresh repaginates correctly.
- Place `Pagination` immediately below the data widget (`TableRecords`, `IList`, `Gallery`).
- For server-side dropdowns with infinite scroll, use `DropdownServerSide_WithOnScrollEnding` instead of Pagination.

**OnNavigate handler shape**

```
StartNode → AssignNode { StartIndex = NewStartIndex } → RefreshDataNode <Aggregate> → EndNode
```

## SectionIndex + SectionIndexItem

Sticky side-anchor navigation that scrolls the page to a target widget.

**`SectionIndex`**

| Parameter | Type | Purpose |
|---|---|---|
| `SectionIndex.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `SectionIndex.Content` | One or more `SectionIndexItem` children. |

**`SectionIndexItem`**

| Parameter | Type | Purpose |
|---|---|---|
| `SectionIndexItem.ScrollToWidgetId` | Text | The `Name` of the target widget on the page. |
| `SectionIndexItem.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `SectionIndexItem.Content` | Anchor label. |

**Composition**

Place `SectionIndex` in a sidebar column (e.g. `ColumnsSmallRight.Column2`) beside the main content. Each target section needs a unique `Name`.

## Submenu

Collapsible navigation group (typically used inside a Menu Block).

| Parameter | Type | Purpose |
|---|---|---|
| `Submenu.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `Submenu.Menu` | The trigger label (icon + text). |
| `Submenu.Items` | `Link` widgets for each child option. |

## TimelineItem

A single chronological event. Stack multiple `TimelineItem` blocks vertically — there is no `Timeline` parent block.

| Parameter | Type | Purpose |
|---|---|---|
| `TimelineItem.Color` | `Entities.Color` | Color of the timeline dot. |
| `TimelineItem.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `TimelineItem.Left` | Date or label shown to the left of the dot. |
| `TimelineItem.Icon` | Icon inside the dot. |
| `TimelineItem.Title` | Event title. |
| `TimelineItem.Content` | Event description. |
| `TimelineItem.Right` | Action icon / button. |

For a data-bound timeline, render `TimelineItem` inside an `IList` over a chronological aggregate.

## BottomBarItem

A single tab in a mobile bottom navigation bar. There is no `BottomBar` parent block — wrap multiple `BottomBarItem` blocks inside a `Container` styled as a bottom bar.

| Parameter | Type | Purpose |
|---|---|---|
| `BottomBarItem.ExtendedClass` | Text | Extra CSS. |

| Placeholder | Contents |
|---|---|
| `BottomBarItem.Icon` | Tab icon. |
| `BottomBarItem.Text` | Tab label. |

**Composition**

- Each `BottomBarItem` is wrapped in a `Link` (or `Button`) with `Width: "(fill parent)"`. The Link's `OnClick` navigates to the target screen.
- Apply `Style: "\"active\""` to the currently selected item's Link.

## Cross-cutting rules

1. **Order matters in Tabs and Wizard.** Header item N maps to content item N, and `WizardItem` order defines step sequence.
2. **`Pagination` has no placeholders.** Argument-only; the Prev/Next icons render automatically.
3. **`Pagination` requires aggregate-level binding.** The aggregate's `StartIndex`/`MaxRecords` must be LocalVariables, and `OnNavigate` must update both and refresh.
4. **Wizard is visual only.** It doesn't render or hide step content — gate that yourself with `IfWidget(CurrentStep = N)`.
5. **`SectionIndex` requires `Name` on each target widget.** The `ScrollToWidgetId` matches the widget's `Name` exactly.
6. **Event parameters use FULL PATH format too** — e.g. `Parameter: "Tabs.OnTabChange.ActiveTab"`, `Parameter: "Pagination.OnNavigate.NewStartIndex"`.

## Accessibility notes

- `Tabs` headers have `role="tab"`, content panels have `role="tabpanel"`. Arrow keys cycle, Enter/Space activates. Don't replace the header item with a non-button widget.
- `Breadcrumbs` is rendered as a `<nav>` with `aria-label="breadcrumb"`. Mark the current page (last crumb) as plain text, not a link.
- `Pagination` renders Prev/Next as `<button>` elements internally and disables them at boundaries automatically. There are no placeholders to override the icons.
- `Wizard` step status is conveyed visually and via `aria-current` on the active step. Tooltip step labels for icon-only steps.
- `BottomBarItem` should be wrapped in `<a>` (Link), not `<div>`, for proper keyboard navigation.
