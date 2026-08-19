---
name: osui-screen-templates
description: Catalog of 17 OutSystems UI Screen Templates (List, Detail, Form, Dashboard, etc.) with composition rules and navigation wiring. Use when scaffolding a new screen, picking a template archetype, or wiring forward navigation from a list to a detail screen.
---

# OutSystems UI — Screen Templates

> **What:** Pre-built screens that ship with OutSystems UI. Use them as the starting point for new screens — never build from blank when an archetype exists.

For widget-level rules see [`widget-conventions.md`](./widget-conventions.md). For pattern reference see [blocks-index.md](./blocks-index.md).

## Catalog

| # | Template | Group | Purpose |
|---|---|---|---|
| 1 | `AdminDashboard` | Dashboards | Counter cards + paginated table with multi-entity joins. |
| 2 | `BulkActions` | Lists | Table with checkbox column + bulk-action toolbar. |
| 3 | `Dashboard` | Dashboards | KPI counters (`Columns3` + `Counter`) + chart card + recent-items list. |
| 4 | `Detail` | Details | Read-only/editable form bound to `GetById` aggregate. |
| 5 | `FourColumnGallery` | Catalogs | 4-col Gallery + sidebar filters (search, category, price). |
| 6 | `HorizontalDetail` | Details | `Columns2` layout with read-only fields. |
| 7 | `List` | Lists | Simple paginated `TableRecords`. |
| 8 | `ListWithFilters` | Lists | Search input + dropdown filter + sortable columns + pagination. |
| 9 | `MasterDetail` | Lists | Side-by-side list + detail panes. |
| 10 | `OnboardingAnimation` | Catalogs | Multi-step onboarding with animations. |
| 11 | `ProductCatalog` | Catalogs | Gallery + category tabs + product cards. |
| 12 | `ProductDetail` | Catalogs | Product image carousel + detail + add-to-cart. |
| 13 | `ProductFeature` | Catalogs | Feature highlight layout. |
| 14 | `RequestCreation` | Details | Create/Edit form with FK dropdown, date picker, file upload. |
| 15 | `RequestDetail` | Details | Read-only detail with status timeline. |
| 16 | `RequestManagement` | Dashboards | Counter cards + status tabs + paginated table. |
| 17 | `TransactionsDashboard` | Dashboards | Chart + transaction list + date-range filter + summary counters. |

## Requirement → template

| Requirement | Template | Why |
|---|---|---|
| "list", "browse", "show all" | `List` | Simple paginated table. |
| "list with filters/search/sort" | `ListWithFilters` | Search + dropdown filter + column sort. |
| "view record / detail" | `Detail` or `RequestDetail` | Form bound to GetById. |
| "create new / edit" | `RequestCreation` | Create/Edit form with save action. |
| "dashboard / overview / KPIs" | `Dashboard` | Counter row + chart + recent list. |
| "admin / management" | `AdminDashboard` or `RequestManagement` | Counters + full paginated table. |
| "catalog / product grid" | `FourColumnGallery` or `ProductCatalog` | Gallery with sidebar filters. |
| "bulk actions / multi-select" | `BulkActions` | Table with checkbox column + toolbar. |
| "master-detail / split view" | `MasterDetail` | Left list + right detail. |

When the user says "create a screen for X", map X to the closest archetype and start from that template. Don't build from `Empty` unless the request really is a one-off.

## Layout structure (every screen)

Every screen wraps content in a layout block (`LayoutTopMenu`, `LayoutSide`, `LayoutLanding`, `LayoutBlank`, `LayoutPopup`, `LayoutNative`). The layout exposes **six placeholders that must ALL be emitted in this exact order**:

```
UIScreen.Widgets
  └── UIBlockInstanceWidget (SourceBlock = "LayoutTopMenu")
        └── PlaceholdersContent (6 entries, in order)
              ├── Header        ← Menu block (or app chrome)
              ├── ActionButton  ← header-level action button (often empty)
              ├── Breadcrumbs   ← breadcrumb trail (often empty)
              ├── Title         ← AdvancedHtml h1 with screen title
              ├── Actions       ← screen-level action buttons (often empty)
              └── MainContent   ← screen body
```

Empty placeholders MUST still be emitted:

```jsonc
{ "Object": "PlaceholderContentWidget", "Placeholder": "ActionButton" }
```

| Placeholder | Default content |
|---|---|
| `Header` | `UIBlockInstanceWidget` with `SourceBlock: "Menu"` (the application's menu block). |
| `ActionButton` | Empty. |
| `Breadcrumbs` | Empty (or `Breadcrumbs` pattern). |
| `Title` | `AdvancedHtml` `Tag: "h1"` with the screen title. |
| `Actions` | Empty (or primary screen-level buttons like "Create Request"). |
| `MainContent` | Your screen content. |

The screen title MUST go in the `Title` placeholder using `AdvancedHtml` h1, never in `MainContent`:

```jsonc
{
  "Object": "PlaceholderContentWidget", "Placeholder": "Title",
  "Widgets": [{
    "Name": "ScreenTitle", "Object": "AdvancedHtml", "Tag": "h1",
    "content": [{ "Object": "TextWidget", "Text": "Request List" }]
  }]
}
```

## Composition rules (apply to all templates)

1. **Every data-bound screen needs at least one `ScreenAggregate`** with `Fetch: "AtStart"`, `MaxRecords`, and a `CombineSourcesOperation` containing `Sources` (and optional `Joins`/`Filters`).
2. **Every list needs `Pagination`** wired to LocalVariables (`StartIndex`, `MaxRecords`) bound to the aggregate's `StartIndex`/`MaxRecords` properties.
3. **Paginated aggregate's `StartIndex` and `MaxRecords` MUST be LocalVariables** (not literals) — otherwise `OnNavigate` can't repaginate.
4. **Search filters use `OnChange` → reset `StartIndex = 0` → `RefreshDataNode`**. The aggregate filter looks like `SearchKeyword = "" or Entity.Field like "%" + SearchKeyword + "%"`.
5. **Dropdown filters** use `Dropdown` with `Variable` bound to a LocalVariable (e.g., `PriorityId Sample_Priority Identifier`), `List` from a separate ScreenAggregate, `Values` = the Id field, `EmptyValue: "All"`. On change, refresh the main aggregate.
6. **Detail screens take an `InputParameter`** of type `<Entity> Identifier`. The `GetById` aggregate filters by `Entity.Id = InputParameterName`. Form fields bind to `<GetById>.List.Current.<Entity>.<Field>`.
7. **Form screens use `Form` + `OnSaveClick`** that checks `Form1.Valid` in an `IfNode` before proceeding.
8. **Create/Edit screens use `IfWidget` for the title** — `If(InputId <> NullIdentifier(), "Edit X", "New X")`.
9. **`TableRecords` requires `headerRow` + `row` arrays** (lowercase keys) with `HeaderCell` and `RowCell` objects. See [`widget-conventions.md`](./widget-conventions.md#2-tablerecords-structure).
10. **Column sort** uses `IsDynamic: "True"` sorts on the aggregate, bound to LocalVariables (`TableSort`, `TableSort2`). The `OnSort` event toggles ASC/DESC.
11. **Buttons use `btn` / `btn-primary`**:
    - Secondary / cancel: `Style: "\"btn\""`
    - Primary: `Style: "\"btn btn-primary\""`
    - Cancel navigates to `(Previous Screen)` with `Transition: "UseHistory"`.

## Annotated walkthroughs

### Dashboard (KPI row + recent list + chart)

```
ScreenAggregates:
  GetChartData (GroupBy + Joins for chart data, MaxRecords 50)
  GetRequests  (Joins for recent list, MaxRecords 4)

LocalVariables: (none)

Widgets (inside MainContent):
  Container
    Columns3 (PhoneBehavior = All)             ← KPI row
      Column1 → Counter "58 / Requests / archive icon"
      Column2 → Counter "22 / High / angle-double-up"
      Column3 → Counter "36 / Low / angle-double-down"
    Container (margin-top: 20px)
      Columns2 (PhoneBehavior = All)
        Column1 → CardSectioned (Title = "Last Requests", Content = List of GetRequests with ListItemContent rows)
        Column2 → CardSectioned (Title = "By Department", Content = DonutChart_v1 from ConvertList(GetChartData.List, …))
```

### List (simple paginated table)

```
ScreenAggregates:
  GetEmployees (Fetch AtStart, MaxRecords = MaxRecords var, StartIndex = StartIndex var)

LocalVariables:
  MaxRecords (Integer, default 8)
  StartIndex (Integer, default 0)

ScreenActions:
  OnPaginationNavigate(NewStartIndex Integer):
    Start → Assign StartIndex = NewStartIndex → RefreshData GetEmployees → End

Widgets (inside MainContent):
  TableRecords (Source = GetEmployees.List)
    headerRow: [Name, Job Position, Department, …]
    row:       [Expression bindings]
  Pagination (MaxRecords, StartIndex, TotalCount = GetEmployees.Count, OnNavigate = OnPaginationNavigate)
    Previous: Icon "angle-left"
    Next:     Icon "angle-right"
```

### ListWithFilters (search + dropdown + sortable + paginated)

```
ScreenAggregates:
  GetPriorities (for dropdown options, MaxRecords 50, sorted by Label ASC)
  GetRequests   (Fetch AtStart, MaxRecords/StartIndex bound to LocalVars)
    Filters:
      SearchKeyword = "" or Sample_Request.Name like "%"+SearchKeyword+"%" or .Description like ...
      PriorityId = NullIdentifier() or Sample_Priority.Id = PriorityId
    Sorts (dynamic): TableSort2, TableSort

LocalVariables:
  SearchKeyword (Text)
  PriorityId    (Sample_Priority Identifier)
  MaxRecords    (Integer, default 8)
  StartIndex    (Integer)
  TableSort     (Text)
  TableSort2    (Text)

ScreenActions:
  OnSearch:               Assign StartIndex = 0 → Refresh GetRequests → End
  FilterPriority:         Refresh GetRequests → End
  OnPaginationNavigate:   Assign StartIndex = NewStartIndex → Refresh GetRequests → End
  OnSort(SortBy Text):    If TableSort2 = SortBy → toggle ASC/DESC → Assign StartIndex = 0 → Refresh → End

Widgets (inside MainContent):
  ColumnsSmallLeft (PhoneBehavior=All, TabletBehavior=None):
    Column1: DEPRECATED_Search → Input (Variable=SearchKeyword, OnChange=OnSearch)
    Column2: AlignCenter → "Filter by" + Dropdown (Variable=PriorityId, Source=GetPriorities.List, EmptyValue="All", OnChange=FilterPriority)
  Container (margin-top-l):
    TableRecords (Source=GetRequests.List, OnSort=OnSort, headerRow with SortAttribute per cell)
    IfWidget (loading guard)
  Pagination (… as in List template)
```

### Detail (form bound to GetById)

```
InputParameters:
  Sample_RequestId (Sample_Request Identifier, Mandatory)

ScreenAggregates:
  GetRequestById:
    Fetch AtStart, MaxRecords 50
    Filters: Sample_Request.Id = Sample_RequestId

ScreenActions:
  OnSaveClick:
    Start → IfNode(Form1.Valid) → True: EndNode(save) / False: EndNode(abort)

Widgets (inside MainContent):
  Columns2:
    Column1:
      Form (Name=Form1, Style="\"form card\"")
        Container → Label(TargetWidget=Input_Name) + Input(Variable=GetRequestById.List.Current.Sample_Request.RequestName, InputType=Text, Mandatory=True, MaxLength=150)
        Container → Label + TextArea(Variable=…Description, MaxLength=500, TextLines=3)
        Container (Width="6 col") → Label + Input(Variable=…DueDate, InputType=Date)
        Container (Width="6 col") → Label + Input(Variable=…CreatedOn, InputType=Datetime)
        Button "Cancel" (Style="\"btn\"", OnClick=(Previous Screen))
        Button "Save"   (Style="\"btn btn-primary\"", IsDefault=True, OnClick=OnSaveClick)
    Column2:
      ImageWidget (banner / illustration)
```

### RequestCreation (Create/Edit form)

Distinguish New vs Edit via `InputParameter <> NullIdentifier()`:

```
InputParameters:
  Sample_RequestId (Sample_Request Identifier, Mandatory; pass NullIdentifier() from "New" buttons)

Title placeholder uses IfWidget:
  If(Sample_RequestId <> NullIdentifier(), "Edit Request", "New Request")
  + subtitle: "ID: " + Expression(Id) when editing

ScreenAggregates:
  GetEmployees (for assignee dropdown)
  GetRequestById (for edit mode)

Form fields wired to GetRequestById.List.Current.Sample_Request.*:
  Name, Description, Priority (Dropdown bound via SetPriority), DueDate (DatePicker via OnSelectedDate), AssignedTo, Upload
```

## Screen navigation wiring (mandatory)

Every new screen MUST have at least one navigation link from somewhere else in the app. Orphaned screens are unreachable.

| Condition | Where to add the link |
|---|---|
| Screen has NO input Id parameter (lists, dashboards) | Menu Block's `PageLinks` container (Common UIFlow). |
| Screen HAS an input Id parameter (detail, edit) | Parent screen — table row cell, action button, or contextual link. |

For Id-bound screens, the navigation MUST pass all mandatory input parameters as `Arguments` on the `BuiltinEvent`. For "create new" buttons targeting a Create/Edit screen, pass `NullIdentifier()` (Integer/Long Integer Id) or `NullTextIdentifier()` (Text Id).

### Adding a contextual link from a list to a detail

Append a `RowCell` to the parent screen's `TableRecords.row`:

```jsonc
{
  "Object": "RowCell",
  "Content": [{
    "Object": "Link",
    "Style": "\"link\"",
    "content": [{ "Object": "TextWidget", "Text": "View" }],
    "OnClick": [{
      "Object": "BuiltinEvent",
      "BuiltInValidations": "None",
      "Destination": "<DetailScreenName>",
      "Transition": "Inherited",
      "Arguments": [{
        "Object": "Argument",
        "Parameter": "<InputParamName>",
        "Value": "<Aggregate>.List.Current.<Entity>.Id"
      }]
    }]
  }]
}
```

### Adding an action button on a detail screen

Append a Button to the parent's `Actions` placeholder, with `Visible` driven by a calculated attribute / state, and `OnClick` navigating to the action screen with the Id as an argument.

### Adding a menu link

The Menu Block lives under `UIFlow[@Name=Common]` (not the screen's MainFlow). Append a `Link` to the `PageLinks` container with an icon, text, and `OnClick` → `BuiltinEvent` targeting the new screen.

## Anti-patterns

- **Don't put screen titles in `MainContent`.** They go in the `Title` placeholder.
- **Don't omit empty layout placeholders.** All six must be emitted, in canonical order.
- **Don't bind aggregate `MaxRecords`/`StartIndex` to literals** when the screen has Pagination. Always use LocalVariables.
- **Don't forget the navigation link** when creating an Id-bound screen. The screen will be orphaned.
- **Don't use the `Empty` template** (or a blank screen) when an archetype matches the user's request. Pick the closest template and customize.
- **Don't reproduce template-style layouts manually.** Drop the template, then edit the bindings — much less error-prone than building from scratch.

## Source

The 17 screen templates are defined in OutSystems UI under UIFlow `LSG_ScreenTemplates`. The structure described above (LayoutTopMenu placeholders, canonical order, Title pattern) applies whether the screen is scaffolded from a template or built from scratch.
