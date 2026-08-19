---
name: osui-recipe-paginated-list
description: End-to-end recipe for the canonical OutSystems UI list screen — TableRecords + search input + dropdown filter + sortable columns + Pagination. Use when building a list screen with filtering and pagination from scratch or heavily customizing the ListWithFilters template.
---

# Recipe — Paginated List with Search, Filter, and Sort

> **Goal:** the canonical "list screen" — `TableRecords` (or `IList`) over an aggregate, with a search input, a dropdown filter, sortable columns, and `Pagination`. End-to-end: aggregate, LocalVariables, ScreenActions, widget tree.

This is the recipe behind the [`ListWithFilters` Screen Template](../screen-templates.md#listwithfilters-lines-32308-33239). Use it when you're scaffolding from a template and need to fill in real entities, or when you're building a list screen from `Empty` and want the standard composition.

For the broader Screen Templates catalog see [`../screen-templates.md`](../screen-templates.md). For widget rules see [`../widget-conventions.md`](../widget-conventions.md). For the `Pagination` block reference see [`../patterns/navigation.md#pagination`](../patterns/navigation.md#pagination).

## What you'll build

```
Layout (LayoutTopMenu)
  Title:          "Request List"
  Actions:        "Add Request" button (optional)
  MainContent:
    ColumnsSmallLeft (PhoneBehavior=All)
      Column1 →   Search Input
      Column2 →   Dropdown filter ("Filter by Priority: <All> | High | Medium | Low")
    Container (margin-top-l)
      TableRecords (sortable headers)
      Loading guard (IfWidget)
    Pagination (Prev/Next/Go-to-page)
```

## Required entity assumptions

For this recipe we assume:

- An entity `Sample_Request` with attributes `Id`, `RequestName`, `Description`, `DueDate`, `Priority` (FK to `Sample_Priority`), `AssignedTo` (FK to `Sample_Employee`).
- A lookup entity `Sample_Priority` with `Id`, `Label`.
- Optional joins to `Sample_Employee` for assignee display.

Replace entity / attribute names throughout the recipe.

## Step 1 — LocalVariables

| Name | Type | Default | Purpose |
|---|---|---|---|
| `SearchKeyword` | Text | `""` | Search input binding. |
| `PriorityId` | `Sample_Priority Identifier` | `NullIdentifier()` | Dropdown filter binding. |
| `MaxRecords` | Integer | `8` | Page size — bound to aggregate's `MaxRecords` AND to `Pagination.MaxRecords`. |
| `StartIndex` | Integer | `0` | Current page offset. |
| `TableSort` | Text | `""` | Active sort column (e.g. `"Sample_Request.RequestName ASC"`). |
| `TableSort2` | Text | `""` | Last clicked column name (used by the toggle-direction logic). |

## Step 2 — Aggregates

### `GetPriorities` (for the dropdown filter)

```
Fetch:      AtStart
MaxRecords: 50
Sources:    Sample_Priority
Sorts:      Sample_Priority.Label ASC
```

### `GetRequests` (the main list)

```
Fetch:       AtStart
MaxRecords:  MaxRecords        ← bound to LocalVariable, NOT a literal
StartIndex:  StartIndex        ← bound to LocalVariable, NOT a literal
Sources:     Sample_Request, Sample_Priority, Sample_Employee
Joins:
  Sample_Request.Priority   = Sample_Priority.Id   (Left)
  Sample_Request.AssignedTo = Sample_Employee.Id   (Left)
Filters:
  SearchKeyword = "" or
    Sample_Request.RequestName like "%" + SearchKeyword + "%" or
    Sample_Request.Description like "%" + SearchKeyword + "%"

  PriorityId = NullIdentifier() or Sample_Priority.Id = PriorityId
Sorts (dynamic, IsDynamic=True):
  TableSort2          ← last clicked attribute, controls direction
  TableSort           ← stable sort order
```

> **Critical:** the aggregate's `MaxRecords` and `StartIndex` MUST be LocalVariable bindings — not literals — or `Pagination.OnNavigate` can't repaginate. See [widget conventions](../widget-conventions.md).

## Step 3 — ScreenActions

### `OnSearch` (fired by Search input's `OnChange`)

```
StartNode
  → AssignNode { StartIndex = 0 }    ← reset to first page on new query
  → RefreshDataNode GetRequests
  → EndNode
```

### `FilterPriority` (fired by dropdown's `OnChange`)

```
StartNode
  → AssignNode { StartIndex = 0 }
  → RefreshDataNode GetRequests
  → EndNode
```

### `OnPaginationNavigate` (fired by `Pagination.OnNavigate`)

```
InputParameter: NewStartIndex (Integer, Mandatory)

StartNode
  → AssignNode { StartIndex = NewStartIndex }
  → RefreshDataNode GetRequests
  → EndNode
```

### `OnSort` (fired by `TableRecords.OnSort`)

```
InputParameter: SortBy (Text, Mandatory)   ← name of the clicked attribute

StartNode
  → IfNode (TableSort2 = SortBy)
       True:  AssignNode { TableSort = SortBy + " DESC" }    ← already sorted ASC, flip
       False: AssignNode { TableSort = SortBy + " ASC" }
  → AssignNode { TableSort2 = SortBy; StartIndex = 0 }
  → RefreshDataNode GetRequests
  → EndNode
```

(The two-step toggle logic — `TableSort` for the SQL order, `TableSort2` for "what's the active column" — is what the `ListWithFilters` template uses. It avoids needing to parse direction back out of `TableSort` later.)

## Step 4 — Widget tree (inside `MainContent` placeholder)

### Filter row

```jsonc
{
  "Object": "UIBlockInstanceWidget", "SourceBlock": "ColumnsSmallLeft",
  "Arguments": [
    { "Object": "Argument", "Parameter": "ColumnsSmallLeft.GutterSize",     "Value": "Entities.Space.Base" },
    { "Object": "Argument", "Parameter": "ColumnsSmallLeft.PhoneBehavior",  "Value": "Entities.BreakColumns.All" }
  ],
  "PlaceholdersContent": [
    {
      "Object": "PlaceholderContentWidget", "Placeholder": "ColumnsSmallLeft.Column1",
      "Widgets": [
        { "Name": "Input_Search", "Object": "Input",
          "Variable": "SearchKeyword",
          "InputType": "Search",
          "Prompt": "\"Search by name or description…\"",
          "Style": "\"form-control\"",
          "Width": "(fill parent)",
          "OnChange": [{ "Object": "BuiltinEvent", "BuiltInValidations": "None",
                         "Destination": "OnSearch", "Transition": "Inherited" }]
        }
      ]
    },
    {
      "Object": "PlaceholderContentWidget", "Placeholder": "ColumnsSmallLeft.Column2",
      "Widgets": [
        { "Object": "Container", "Style": "\"display-flex align-items-center justify-content-end\"",
          "content": [
            { "Object": "TextWidget", "Text": "Filter by", "StyleClasses": "\"margin-right-s\"" },
            { "Object": "Dropdown", "Name": "Dropdown_Priority",
              "Variable": "PriorityId",
              "List": "GetPriorities.List",
              "Values": "GetPriorities.List.Current.Sample_Priority.Id",
              "EmptyValue": "\"All\"",
              "Width": "\"4 col\"",
              "Style": "\"dropdown\"",
              "DropdownMode": "Custom",
              "content": [
                { "Object": "Expression",
                  "Value": "GetPriorities.List.Current.Sample_Priority.Label" }
              ],
              "OnChange": [{ "Object": "BuiltinEvent", "BuiltInValidations": "None",
                             "Destination": "FilterPriority", "Transition": "Fade" }]
            }
          ]
        }
      ]
    }
  ]
}
```

### Table

```jsonc
{
  "Object": "Container", "Style": "\"margin-top-l\"",
  "content": [
    {
      "Object": "TableRecords", "Name": "Table_Requests",
      "Source": "GetRequests.List",
      "ShowHeader": "True",
      "Style": "\"table\"",
      "StyleHeader": "\"table-header\"",
      "StyleRow": "\"table-row\"",
      "headerRow": [
        { "Object": "HeaderCell", "Source": "GetRequests.List",
          "SortAttribute": "Sample_Request.RequestName",
          "content": [{ "Object": "TextWidget", "Text": "Request Name" }] },
        { "Object": "HeaderCell", "Source": "GetRequests.List",
          "SortAttribute": "Sample_Priority.Label",
          "content": [{ "Object": "TextWidget", "Text": "Priority" }] },
        { "Object": "HeaderCell", "Source": "GetRequests.List",
          "SortAttribute": "Sample_Request.DueDate",
          "content": [{ "Object": "TextWidget", "Text": "Due Date" }] },
        { "Object": "HeaderCell", "Source": "GetRequests.List",
          "SortAttribute": "Sample_Employee.FirstName",
          "content": [{ "Object": "TextWidget", "Text": "Assigned To" }] }
      ],
      "row": [
        { "Object": "RowCell",
          "content": [{ "Object": "Expression",
            "Value": "GetRequests.List.Current.Sample_Request.RequestName" }] },
        { "Object": "RowCell",
          "content": [{ "Object": "Expression",
            "Value": "GetRequests.List.Current.Sample_Priority.Label" }] },
        { "Object": "RowCell",
          "content": [{ "Object": "Expression",
            "Value": "FormatDateTime(GetRequests.List.Current.Sample_Request.DueDate, \"d MMM yyyy\")" }] },
        { "Object": "RowCell",
          "content": [{ "Object": "Expression",
            "Value": "GetRequests.List.Current.Sample_Employee.FirstName + \" \" + GetRequests.List.Current.Sample_Employee.LastName" }] }
      ],
      "OnSort": [
        { "Object": "BuiltinEvent", "BuiltInValidations": "None",
          "Destination": "OnSort", "Transition": "Inherited",
          "Arguments": [{ "Object": "Argument", "Parameter": "SortBy", "Value": "ClickedColumn" }] }
      ]
    },
    /* Loading guard: shown only while the aggregate is refreshing */
    { "Object": "IfWidget",
      "Condition": "GetRequests.IsDataFetched or GetRequests.List.Empty",
      "TrueBranch":  [],
      "FalseBranch": [{
        "Object": "IfBranchWidget",
        "Widgets": [{ "Object": "Container", "Style": "\"table-updating\"" }]
      }]
    }
  ]
}
```

### Pagination

```jsonc
{
  "type_": "IMobileBlockInstanceWidget", "SourceBlock": "Pagination",
  "Arguments": [
    { "type_": "IArgument", "Parameter": "Pagination.MaxRecords",   "Value": "MaxRecords" },
    { "type_": "IArgument", "Parameter": "Pagination.StartIndex",   "Value": "StartIndex" },
    { "type_": "IArgument", "Parameter": "Pagination.TotalCount",   "Value": "GetRequests.Count" },
    { "type_": "IArgument", "Parameter": "Pagination.ShowGoToPage", "Value": "True" }
  ],
  "PlaceholdersContent": [],
  "EventHandlers": [
    {
      "type_": "IEventHandler",
      "Event": "Pagination.OnNavigate",
      "Handler": "!OnPaginationNavigate",
      "Arguments": [
        { "type_": "IArgument",
          "Parameter": "Pagination.OnNavigate.NewStartIndex",
          "Value": "NewStartIndex" }
      ]
    }
  ]
}
```

## Step 5 — Empty state

Wrap the table + pagination in an `IfWidget` to show a `BlankSlate` when the aggregate has no rows:

```
IfWidget Condition: GetRequests.IsDataFetched and GetRequests.List.Empty
  TrueBranch:  BlankSlate (Icon=search, Content="No requests match your filters", Actions=[Reset filters Button])
  FalseBranch: <table + pagination from Step 4>
```

A "Reset filters" Button on the BlankSlate calls a `ResetFilters` ScreenAction that clears `SearchKeyword`, `PriorityId`, `StartIndex` and refreshes.

## Variations

### Server-side debouncing on search

Firing `RefreshDataNode` on every keystroke is fine for small datasets but expensive for large ones. To debounce, replace the immediate refresh with:

1. A LocalVariable `LastKeystroke` (Text).
2. `OnSearch` assigns `SearchKeyword` and `LastKeystroke = SearchKeyword`, then `WaitNode` 250ms.
3. After the wait, an `IfNode` checks `LastKeystroke = SearchKeyword`. If true, refresh; if false, the user kept typing — bail.

See [`../../common/ui-performance.md#debounce-search-inputs`](../../common/ui-performance.md#debounce-search-inputs).

### Multiple filters

Each filter follows the same pattern as `PriorityId`:
1. LocalVariable.
2. Filter expression on the aggregate (`<Var> = NullIdentifier() or Entity.Field = <Var>`).
3. Dropdown's `OnChange` → ScreenAction → `Assign(StartIndex=0)` + `RefreshDataNode`.

Combine all filters in one `RefreshDataNode` call — the aggregate re-evaluates all filter conditions together.

### Row click → detail screen

Add a row-level Link wrapping the first column's content:

```jsonc
{ "Object": "Link", "Style": "\"link\"",
  "content": [{ "Object": "Expression", "Value": "GetRequests.List.Current.Sample_Request.RequestName" }],
  "OnClick": [{
    "Object": "BuiltinEvent",
    "Destination": "RequestDetailScreen",
    "Transition": "Inherited",
    "Arguments": [{ "Object": "Argument",
      "Parameter": "Sample_RequestId",
      "Value": "GetRequests.List.Current.Sample_Request.Id" }]
  }]
}
```

See [`../screen-templates.md#case-b-contextual-link-detailedit-screen`](../screen-templates.md) for the full navigation pattern.

## Anti-patterns

- **Hardcoded `MaxRecords` / `StartIndex`** on the aggregate. They MUST be LocalVariables — otherwise `Pagination.OnNavigate` doesn't repaginate.
- **Skipping `Assign(StartIndex = 0)` on filter/search change.** Without it, the user is stuck on page 5 of an old result set when their new query returns 3 total rows.
- **Filtering client-side with `IfWidget` over a fully-fetched aggregate.** Push the filter into the aggregate's `Filters` — far cheaper at scale.
- **Sorting client-side.** Use the aggregate's `Sorts` with `IsDynamic: True`.
- **Forgetting the loading guard.** During refresh, the table holds the old rows for a beat — without a `table-updating` overlay, users see stale data with no signal.
- **No empty state.** Always wrap with `IfWidget(<Aggregate>.IsDataFetched and <Aggregate>.List.Empty)` and show a `BlankSlate`.
- **Triggering `RefreshDataNode` from `OnReady` instead of relying on `Fetch: AtStart`.** The aggregate already fetches on screen load — manual refresh duplicates the call.

## Related

- [`../patterns/navigation.md#pagination`](../patterns/navigation.md#pagination) — Pagination block reference.
- [`../screen-templates.md`](../screen-templates.md) — Screen Templates catalog (List, ListWithFilters, MasterDetail).
- [`../widget-conventions.md`](../widget-conventions.md) — `TableRecords` headerRow/row structure, expression binding paths, event wiring.
- [`../../common/ui-performance.md`](../../common/ui-performance.md) — debouncing search, lazy loading, pagination guidance.
- [`../patterns/content.md#blankslate`](../patterns/content.md#blankslate) — empty-state block.
