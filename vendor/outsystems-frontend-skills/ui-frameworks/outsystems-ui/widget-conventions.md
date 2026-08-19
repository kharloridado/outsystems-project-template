---
name: osui-widget-conventions
description: Critical OutSystems UI widget conventions — content vs Widgets keys, TableRecords structure, qualified expression paths, FULL PATH parameter naming, event wiring. Use when generating widget JSON or debugging silent failures (empty widgets, missing columns, ignored styles).
---

# OutSystems UI — Widget Conventions

> Critical rules for getting widget bindings, structure, and event wiring right. Violating these causes silent failures: the app compiles but widgets render empty, columns disappear, or interactions do nothing.

## Quick reference

| # | Rule | Right | Wrong | Consequence |
|---|---|---|---|---|
| 1 | Child key | `Form.content: [...]` | `Form.Widgets: [...]` | Empty widget |
| 2 | Table structure | `headerRow: [HeaderCell…]`, `row: [RowCell…]` | `HeaderRow: { … }` | Zero columns |
| 3 | Expression path | `Agg.List.Current.Entity.Attr` | `Attr` or `Entity.Attr` | Empty / runtime error |
| 4 | Style quoting | `Style: "\"btn\""` | `Style: "btn"` | No styling applied |
| 5 | Form nesting | `Label.TargetWidget` → `Input.Name` | Inputs without paired Labels | Broken accessibility |
| 6 | Placeholder names | `"MainContent"` | `"Content"` (in a layout) | Missing content |
| 7 | Block constraint | `Container > UIBlockInstanceWidget` | `UIBlockInstanceWidget.Style: "…"` | Style ignored |
| 8 | Event wiring | `OnChange: [{ BuiltinEvent, Destination }]` | No `OnChange` | Silent no-op |
| 9 | Block instance | `Arguments: [], PlaceholdersContent: []` (always present) | Either missing | `childCollection cannot be null` |
| 10 | Parameter naming | `"Card.UsePadding"` (FULL PATH); event args: `"Tabs.OnTabChange.ActiveTab"` | `"UsePadding"` (bare) | Patch validation failure (modelAPI) |

## 1. `content` vs `Widgets`

Most interactive widgets use lowercase `content` for children. Three specific objects use capitalized `Widgets`.

**Use lowercase `content`:**
`Button`, `ButtonGroup`, `ButtonGroupItem`, `Container`, `Dropdown`, `Form`, `HeaderCell`, `Label`, `Link`, `List`, `ListItem`, `Popup`, `RadioButton`, `RadioGroup`, `RowCell`, `Upload`.

**Use capitalized `Widgets`:**
`IfBranchWidget`, `PlaceholderContentWidget`, `UIBlock`.

```jsonc
// ✅ correct
{ "Object": "Form", "content": [ /* … */ ] }
{ "Object": "PlaceholderContentWidget", "Placeholder": "MainContent", "Widgets": [ /* … */ ] }

// ❌ wrong (children silently dropped)
{ "Object": "Form", "Widgets": [ /* … */ ] }
```

## 2. TableRecords structure

`TableRecords` uses lowercase `headerRow` (array of `HeaderCell` objects) and lowercase `row` (array of `RowCell` objects). Each cell uses lowercase `content` for its children.

```jsonc
{
  "Object": "TableRecords",
  "Source": "GetEmployees.List",
  "Style": "\"table\"",
  "StyleHeader": "\"table-header\"",
  "StyleRow": "\"table-row\"",
  "headerRow": [
    { "Object": "HeaderCell", "Source": "GetEmployees.List",
      "SortAttribute": "Sample_Employee.FirstName",
      "content": [{ "Object": "TextWidget", "Text": "Name" }] }
  ],
  "row": [
    { "Object": "RowCell",
      "content": [{ "Object": "Expression",
        "Value": "GetEmployees.List.Current.Sample_Employee.FirstName" }] }
  ]
}
```

**Key facts:**

- `headerRow` and `row` are **arrays**, not objects. Wrong casing or shape produces zero columns.
- `Source` on `TableRecords` is `<Aggregate>.List`.
- `Source` on `HeaderCell` matches the table's `Source` and enables sorting.
- `SortAttribute` on `HeaderCell` is the qualified entity attribute path: `<AliasedSource>.<Attribute>`.

## 3. Qualified expression paths

`Expression.Value`, `Input.Variable`, `TextArea.Variable`, `Checkbox.Variable`, `Dropdown.Variable` all require fully-qualified aggregate paths:

```
<ScreenAggregateName>.List.Current.<AliasedSource>.<Attribute>
```

```jsonc
// ✅ correct
{ "Object": "Expression",
  "Value": "GetEmployees.List.Current.Sample_Employee.FirstName" }

// ❌ wrong — bare or partially qualified
{ "Object": "Expression", "Value": "FirstName" }
{ "Object": "Expression", "Value": "Sample_Employee.FirstName" }
```

**Tips**

- When an aggregate has no rows, `.List.Current` returns an empty record. Guard with `If(<Aggregate>.List.Empty, "—", <Aggregate>.List.Current.<Entity>.<Attr>)` if needed.
- To capture per-row user input (e.g., a checkbox per row), add a calculated attribute on the aggregate (`IsSelected = False`) and bind the checkbox to it.

## 4. Style and ExtendedClass values must be quoted strings

Style values are OutSystems expressions, so a literal CSS class name must be wrapped in escaped quotes — otherwise it's parsed as an identifier.

```jsonc
// ✅ correct
{ "Style": "\"btn btn-primary\"" }
{ "Style": "\"form-control\"" }

// ❌ wrong (treated as expression identifiers, resolves to empty)
{ "Style": "btn btn-primary" }
```

**Dynamic style expressions** concatenate quoted literals with variables:

```jsonc
{ "Style": "\"btn \" + If(IsPrimary, \"btn-primary\", \"\") + \" \" + Shape" }
{ "StyleRow": "\"table-row\" + If(ZebraStripping, \" table-row-stripping\", \"\")" }
```

## 5. Form nesting

Forms wrap input pairs in a column layout. Each `Label` MUST point to its paired `Input` via `TargetWidget` (the input's `Name`).

```
Form.content
└─ UIBlockInstanceWidget(SourceBlock = "Columns2")
   ├─ PlaceholderContentWidget [Columns2.Column1]
   │   └─ Label (TargetWidget = "Input_FirstName")
   │   └─ Input (Name = "Input_FirstName", Variable = "Agg.List.Current.Entity.FirstName")
   └─ PlaceholderContentWidget [Columns2.Column2]
       └─ Label (TargetWidget = "Input_LastName")
       └─ Input (Name = "Input_LastName", …)
```

**Required Input properties:**

- `Name` — referenced by the paired Label's `TargetWidget`.
- `Variable` — qualified aggregate path.
- `InputType` — match the bound attribute: `Text`, `Number`, `Date`, `Datetime`, `Email`, `Phone`, …
- `Width: "(fill parent)"` — otherwise inputs collapse.
- `Style: "\"form-control\""`
- `Mandatory: "True"` for required fields.
- `MaxLength` matching the entity attribute's length.

Missing `TargetWidget` breaks accessibility (no label association) and validation highlighting.

## 6. Placeholder names are case-sensitive

| Context | Valid placeholders |
|---|---|
| Layout block (e.g. `LayoutTopMenu`) | `Header`, `ActionButton`, `Breadcrumbs`, `Title`, `Actions`, `MainContent` |
| `Columns2`/`Columns3`/… | `Column1`, `Column2`, `Column3`, … |
| OutSystemsUI pattern blocks (modelAPI) | FULL PATH: `<SourceBlock>.<Name>`, e.g. `"Card.Content"`, `"Tabs.Header"`. See [blocks-index.md](./blocks-index.md). |

Misspelled placeholder names cause content to be silently dropped — the layout renders, but the slot is empty.

## 7. UIBlockInstanceWidget cannot be styled directly

`UIBlockInstanceWidget` does NOT accept `Width`, `Margin`, `Style`, or `CustomStyle` properties. To apply layout or styling to a block, **wrap it in a `Container`**.

```jsonc
// ❌ wrong — properties silently ignored
{ "Object": "UIBlockInstanceWidget", "SourceBlock": "Card", "Style": "\"shadow-l\"" }

// ✅ correct — wrap in Container
{ "Object": "Container", "Style": "\"shadow-l margin-bottom-base\"",
  "content": [
    { "Object": "UIBlockInstanceWidget", "SourceBlock": "Card", "Arguments": [], "PlaceholdersContent": [/* … */] }
  ]
}
```

The block's own `ExtendedClass` argument can apply CSS classes to the block's root, but it doesn't support `CustomStyle` or `Width`.

## 8. Widget event wiring (OnChange / OnClick)

Interactive widgets need an `OnChange` or `OnClick` array of `BuiltinEvent` objects to fire ScreenActions. Without wiring, the widget renders but does nothing on user interaction.

**Widgets supporting `OnChange`:** `Checkbox`, `Input`, `Dropdown`, `TextArea`, `Switch`, `Upload`.
**Widgets supporting `OnClick`:** `Button`, `Link`.

```jsonc
{
  "Object": "Checkbox",
  "Variable": "GetItems.List.Current.Item.InTheBasket",
  "OnChange": [{
    "Object": "BuiltinEvent",
    "BuiltInValidations": "None",
    "Destination": "ToggleInTheBasket",
    "Transition": "Inherited"
  }]
}
```

**Rules:**

- `Destination` must reference a `ScreenAction` on the same screen (not a ClientAction, ServerAction, or screen name).
- `BuiltInValidations`:
  - `"None"` for toggles, filters, non-form interactions.
  - `"Client"` for form save buttons that should validate inputs.
- `Arguments` is optional; for list-context actions (inside `TableRecords`/`IList`), the `.List.Current` context is automatically available.
- `Transition`: `"Inherited"` (default), `"Fade"`, `"SlideFromRight"`.
- For events with parameters (e.g., `OnSort` → `ClickedColumn`), declare `InputParameters` on the `BuiltinEvent` and pass via `Arguments`.

## 9. UIBlockInstanceWidget required arrays

Every `IMobileBlockInstanceWidget` MUST include both:

```jsonc
{
  "type_": "IMobileBlockInstanceWidget",
  "SourceBlock": "Card",
  "Arguments": [],            // even if empty
  "PlaceholdersContent": []   // even if empty
}
```

Omitting either causes a `childCollection cannot be null` error at compile time.

## 10. FULL PATH parameter naming (modelAPI)

When generating new model patches, every `Parameter` and `Placeholder` value uses the FULL PATH format `<SourceBlock>.<Name>`:

```jsonc
{ "type_": "IArgument", "Parameter": "Card.UsePadding", "Value": "True" }
{ "type_": "IPlaceholderContentWidget", "Placeholder": "Card.Content", "Widgets": [/* … */] }
```

**Event handler parameters use FULL PATH too**, with the event name in the middle: `<SourceBlock>.<EventName>.<ArgumentName>`:

```jsonc
{
  "type_": "IEventHandler",
  "Event": "Tabs.OnTabChange",                         // event identifier
  "Handler": "!HandleTabChange",
  "Arguments": [{
    "type_": "IArgument",
    "Parameter": "Tabs.OnTabChange.ActiveTab",         // ← FULL PATH event arg
    "Value": "CurrentTab"
  }]
}
```

Examples:

- `"Tabs.OnTabChange.ActiveTab"` — the new active tab index.
- `"Pagination.OnNavigate.NewStartIndex"` — the new offset.
- `"DatePicker.OnSelected.SelectedDateTime"` — the picked date.
- `"DatePickerRange.OnSelected.SelectedStartDate"` and `".SelectedEndDate"` — pass each as a separate argument.
- `"Rating.OnSelect.RatingValue"` — the selected score.

Bare names like `"UsePadding"` or `"NewStartIndex"` only work in the older serialized JSON (used inside the StyleGuide app source). Always include the prefix in new model patches.

## Canonical layout placeholder order

Every screen wraps content in a layout block (`LayoutTopMenu`, `LayoutSide`, `LayoutLanding`, `LayoutBlank`, `LayoutPopup`, `LayoutNative`). The six layout placeholders MUST appear in this exact order, ALL emitted (even empty):

```
Header → ActionButton → Breadcrumbs → Title → Actions → MainContent
```

Empty placeholders are emitted as:

```jsonc
{ "Object": "PlaceholderContentWidget", "Placeholder": "<Name>" }
```

The screen title goes in the `Title` placeholder using an `AdvancedHtml` h1 tag — never directly in `MainContent`:

```jsonc
{
  "Object": "PlaceholderContentWidget", "Placeholder": "Title",
  "Widgets": [{
    "Name": "ScreenTitle", "Object": "AdvancedHtml", "Tag": "h1",
    "content": [{ "Object": "TextWidget", "Text": "<Screen Title>" }]
  }]
}
```

See [`screen-templates.md`](./screen-templates.md) for the full layout structure.

## Common widgets quick reference

| Widget | Purpose | Key properties |
|---|---|---|
| `Button` | Action trigger | `Style`, `Enabled`, `OnClick`, `content` (TextWidget + optional Icon) |
| `Link` | Navigation/action link | `Destination` or `OnClick`, `content` |
| `Input` | Single-line text/date/number | `Variable`, `InputType`, `Mandatory`, `Style: "\"form-control\""` |
| `TextArea` | Multi-line input | `Variable`, `Mandatory`, `Style` |
| `Checkbox` | Boolean toggle | `Variable`, `OnChange` |
| `Switch` | Mobile-friendly on/off | `Variable`, `OnChange` |
| `RadioButton` / `RadioGroup` | Single-select | `Variable`, options |
| `Dropdown` | Select from list | `Source` (Aggregate.List), `Variable`, `content` for option template |
| `Upload` | File upload | `content`, accepted types |
| `Form` | Validation container | `content` (Label+Input pairs), `OnSaveClick` action with `Form1.Valid` check |
| `Label` | Field label | `TargetWidget` (Input's Name), `content` |
| `List` / `ListItem` | Repeating container | `Source = <Aggregate>.List` |
| `TableRecords` | Tabular data | `headerRow` + `row`, `Source`, optional `OnSort` |
| `Container` | Generic block-level wrapper | `Style`, `CustomStyle`, `content` |
| `IfWidget` | Conditional rendering | `Condition`, `TrueBranch`, `FalseBranch` (each = `IfBranchWidget` with `Widgets`) |
| `TextWidget` | Static text | `Text`, `StyleClasses` |
| `Expression` | Bound text | `Value` (qualified path or expression) |
| `Icon` | Icon glyph | `Icon`, `IconSize`, `Style` |
| `ImageWidget` | Image | `Image` (Binary or static), `Width`, `Height` |
| `AdvancedHtml` | Custom HTML tag | `Tag` (`"h1"`, `"section"`, …), `content` |

## Tokens and utility classes

OutSystems UI generates utility classes from the [design tokens](../../foundations/outsystems-design-tokens/design-tokens.md):

- **Spacing**: `margin-top-{xs|s|base|m|l|xl}`, `padding-{base|s|m|l}`, `margin-bottom-base`, …
- **Typography**: `font-size-display`, `font-size-h1`–`h6`, `heading1`–`heading6`, `font-bold`
- **Color**: `text-neutral-0` through `text-neutral-10`, `text-primary`, `background-primary`, `background-neutral-0`
- **Layout**: `display-flex`, `justify-content-end`, `align-items-center`, `text-align-center`
- **Elevation**: `shadow-s`, `shadow-l`
- **Border**: `border`, `border-radius-soft`

Reference these via `Style: "\"<class names>\""`. Don't write equivalent custom CSS — the tokens already match the active theme.

## Common mistakes catalog

| Mistake | Fix |
|---|---|
| `Form.Widgets: [...]` | `Form.content: [...]` |
| `TableRecords.HeaderRow: { … }` (object) | `TableRecords.headerRow: [HeaderCell, …]` (array) |
| `Expression.Value: "FirstName"` (bare) | `Expression.Value: "Agg.List.Current.Entity.FirstName"` |
| `Style: "btn"` | `Style: "\"btn\""` |
| `Label` with no `TargetWidget` | Add `TargetWidget = "<Input.Name>"` |
| `MainContent` placeholder named `"Content"` | Use exact name `"MainContent"` |
| `UIBlockInstanceWidget.Style: "…"` | Wrap in `Container` |
| Checkbox without `OnChange` | Add `OnChange: [BuiltinEvent → ScreenAction]` |
| `IMobileBlockInstanceWidget` missing `Arguments` or `PlaceholdersContent` | Always emit both, even empty arrays |
| `Parameter: "UsePadding"` (modelAPI patch) | `Parameter: "Card.UsePadding"` (FULL PATH) |
