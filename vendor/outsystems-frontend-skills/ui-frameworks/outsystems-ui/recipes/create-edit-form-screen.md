---
name: osui-recipe-create-edit-form
description: End-to-end recipe for an OutSystems UI Create/Edit form screen — one screen handling both modes via an Identifier input parameter (NullIdentifier() for Create). Use when building a form screen that creates or edits a single entity record.
---

# Recipe — Create/Edit Form Screen

> **Goal:** the canonical "form screen" — one screen that handles both **Create** (New record) and **Edit** (existing record) by inspecting an Id input parameter. End-to-end: input parameters, aggregates, ScreenActions, validation, the Form widget tree.

This is the recipe behind the [`RequestCreation` Screen Template](../screen-templates.md#requestcreation-lines-39778-40621). Use it whenever a screen edits a single entity record and the same UI should also accept brand-new records.

For widget rules see [`../widget-conventions.md`](../widget-conventions.md). For the Form composition pattern (Label + Input pairs in Columns) see [§5 of widget conventions](../widget-conventions.md#5-form-nesting).

## What you'll build

```
Layout (LayoutTopMenu)
  Title:    If(<EntityId> <> NullIdentifier(), "Edit Request", "New Request")
  Actions:  Cancel button, Save button
  MainContent:
    Form (Name=Form1)
      Columns2
        Column1: Label + Input (Name)
        Column2: Label + Dropdown (Priority)
      Columns2
        Column1: Label + DatePicker (DueDate)
        Column2: Label + Dropdown (AssignedTo)
      Container:
        Label + TextArea (Description, full width)
      Container:
        Label + Upload (Attachment)
```

## Required entity assumptions

For this recipe:

- An entity `Sample_Request` with `Id`, `RequestName`, `Description`, `DueDate`, `Priority` (FK), `AssignedTo` (FK), `Attachment` (Binary), `AttachmentFileName` (Text).
- Lookup entities `Sample_Priority` and `Sample_Employee` for dropdowns.
- A server action `Sample_RequestCreateOrUpdate(Source: Sample_Request)` that performs the save.

Replace entity / attribute / server-action names throughout.

## Step 1 — Input parameter

Single Id parameter that doubles as "create or edit" mode:

| Name | Type | IsMandatory | Default |
|---|---|---|---|
| `Sample_RequestId` | `Sample_Request Identifier` | `True` | — |

**Calling convention:**
- **Create:** navigate with `Sample_RequestId = NullIdentifier()`.
- **Edit:** navigate with `Sample_RequestId = <existing Id>`.

`NullIdentifier()` is the canonical "no record yet" sentinel. The `IsMandatory: True` enforces that callers always pass a value (even if it's null).

## Step 2 — Aggregates

### `GetPriorities` (for Priority dropdown)

```
Fetch:      AtStart
MaxRecords: 50
Sources:    Sample_Priority
Sorts:      Sample_Priority.Label ASC
```

### `GetEmployees` (for AssignedTo dropdown)

```
Fetch:      AtStart
MaxRecords: 50
Sources:    Sample_Employee
Sorts:      Sample_Employee.FirstName ASC
```

### `GetRequestById` (existing record, edit mode)

```
Fetch:      AtStart
MaxRecords: 1
Sources:    Sample_Request, Sample_Priority, Sample_Employee
Joins:
  Sample_Request.Priority   = Sample_Priority.Id   (Left)
  Sample_Request.AssignedTo = Sample_Employee.Id   (Left)
Filters:
  Sample_Request.Id = Sample_RequestId
```

> **Why fetch in create mode too?** In Create mode `Sample_RequestId = NullIdentifier()` and the aggregate returns 0 rows. `GetRequestById.List.Current.Sample_Request.<Field>` evaluates to the entity's empty defaults — which is exactly what blank input fields want. No special-casing needed in the form.

## Step 3 — LocalVariables (optional, for file upload)

| Name | Type | Default | Purpose |
|---|---|---|---|
| `BinaryData` | `Binary Data` | — | Holds the Upload widget's binary. |
| `FileName` | Text | `""` | Holds the Upload widget's filename. |

(Not needed if the form has no file fields.)

## Step 4 — ScreenActions

### `OnSaveClick` (the primary save handler)

```
StartNode
  → IfNode (Form1.Valid)
       True:
         → ExecuteServerActionNode Sample_RequestCreateOrUpdate(
             Source = GetRequestById.List.Current.Sample_Request
           )
         → IfNode (BinaryData <> NullBinary())                    ← only if file uploaded
              True:  ExecuteServerActionNode SaveAttachment(...)
              False: skip
         → DestinationNode (Previous Screen, Transition: UseHistory)
         → EndNode
       False:
         → EndNode                                                ← validation failed; messages shown inline
```

The Form widget surfaces validation messages automatically when `Form1.Valid` returns `False`. Don't write custom validation UI for `Mandatory` / `MaxLength` / type errors.

### `Cancel`

Just navigates back:

```
StartNode
  → DestinationNode (Previous Screen, Transition: UseHistory)
  → EndNode
```

In practice, the Cancel button can navigate directly without a ScreenAction — set `OnClick.Destination` to `(Previous Screen)`.

### Optional: Dropdown change handlers

If a Priority change should affect another field (e.g. auto-set `DueDate` for "Urgent"), wire `Dropdown.OnChange`:

```
ScreenAction: SetPriority
  InputParameter: PriorityId (Sample_Priority Identifier)

  StartNode
    → AssignNode { GetRequestById.List.Current.Sample_Request.Priority = PriorityId }
    → IfNode (PriorityId = Entities.PriorityCode.Urgent)
        True:  AssignNode { GetRequestById.List.Current.Sample_Request.DueDate = AddDays(CurrDate(), 1) }
        False: skip
    → EndNode
```

## Step 5 — Widget tree

### Title placeholder (Create vs Edit)

```jsonc
{
  "Object": "PlaceholderContentWidget", "Placeholder": "Title",
  "Widgets": [{
    "Object": "IfWidget",
    "Condition": "Sample_RequestId <> NullIdentifier()",
    "TrueBranch": [{
      "Object": "IfBranchWidget",
      "Widgets": [{
        "Object": "AdvancedHtml", "Tag": "h1",
        "content": [{ "Object": "TextWidget", "Text": "Edit Request" }]
      }]
    }],
    "FalseBranch": [{
      "Object": "IfBranchWidget",
      "Widgets": [{
        "Object": "AdvancedHtml", "Tag": "h1",
        "content": [{ "Object": "TextWidget", "Text": "New Request" }]
      }]
    }]
  }]
}
```

### Actions placeholder (Cancel + Save)

```jsonc
{
  "Object": "PlaceholderContentWidget", "Placeholder": "Actions",
  "Widgets": [
    { "Object": "Button", "Style": "\"btn\"",
      "content": [{ "Object": "TextWidget", "Text": "Cancel" }],
      "OnClick": [{ "Object": "BuiltinEvent", "BuiltInValidations": "None",
                    "Destination": "(Previous Screen)", "Transition": "UseHistory" }]
    },
    { "Object": "Button", "Style": "\"btn btn-primary\"",
      "IsDefault": "True",
      "content": [{ "Object": "TextWidget",
        "Text": "If(Sample_RequestId <> NullIdentifier(), \"Save\", \"Create Request\")" }],
      "OnClick": [{ "Object": "BuiltinEvent", "BuiltInValidations": "Client",
                    "Destination": "OnSaveClick", "Transition": "Inherited" }]
    }
  ]
}
```

> **`BuiltInValidations: "Client"` on Save** — triggers Form's client-side validation. Without it, `Form1.Valid` is never set and the IfNode in OnSaveClick takes the False branch. Use `"None"` on Cancel so partial input doesn't block leaving.

### Form (inside MainContent)

```jsonc
{
  "Name": "Form1",
  "Object": "Form",
  "Style": "\"form card\"",
  "content": [
    {
      "Object": "UIBlockInstanceWidget", "SourceBlock": "Columns2",
      "Arguments": [
        { "Object": "Argument", "Parameter": "Columns2.GutterSize",    "Value": "Entities.Space.Base" },
        { "Object": "Argument", "Parameter": "Columns2.PhoneBehavior", "Value": "Entities.BreakColumns.All" }
      ],
      "PlaceholdersContent": [
        {
          "Object": "PlaceholderContentWidget", "Placeholder": "Columns2.Column1",
          "Widgets": [
            { "Object": "Label", "TargetWidget": "Input_RequestName",
              "content": [{ "Object": "TextWidget", "Text": "Request Name" }] },
            { "Name": "Input_RequestName", "Object": "Input",
              "Variable": "GetRequestById.List.Current.Sample_Request.RequestName",
              "InputType": "Text",
              "Mandatory": "True",
              "MaxLength": "150",
              "Width": "(fill parent)",
              "Style": "\"form-control\"" }
          ]
        },
        {
          "Object": "PlaceholderContentWidget", "Placeholder": "Columns2.Column2",
          "Widgets": [
            { "Object": "Label", "TargetWidget": "Dropdown_Priority",
              "content": [{ "Object": "TextWidget", "Text": "Priority" }] },
            { "Name": "Dropdown_Priority", "Object": "Dropdown",
              "Variable": "GetRequestById.List.Current.Sample_Request.Priority",
              "List": "GetPriorities.List",
              "Values": "GetPriorities.List.Current.Sample_Priority.Id",
              "EmptyValue": "\"Select…\"",
              "Width": "(fill parent)",
              "Style": "\"form-control\"",
              "DropdownMode": "Custom",
              "content": [{ "Object": "Expression",
                "Value": "GetPriorities.List.Current.Sample_Priority.Label" }]
            }
          ]
        }
      ]
    },
    /* Second Columns2 row: DueDate + AssignedTo (same shape as above) */
    /* Description (full width, TextArea instead of Input) */
    { "Object": "Container", "Style": "\"margin-top-base\"",
      "content": [
        { "Object": "Label", "TargetWidget": "TextArea_Description",
          "content": [{ "Object": "TextWidget", "Text": "Description" }] },
        { "Name": "TextArea_Description", "Object": "TextArea",
          "Variable": "GetRequestById.List.Current.Sample_Request.Description",
          "MaxLength": "500",
          "TextLines": "4",
          "Width": "(fill parent)",
          "Style": "\"form-control\"" }
      ]
    }
  ]
}
```

## Step 6 — Cancel-confirms-discard (optional)

If the form may have unsaved changes, wrap Cancel in a confirmation popup:

1. Add a `ShowDiscardPopup` LocalVariable (Boolean, default False).
2. Cancel button calls a `MaybeCancel` ScreenAction:
   - If form is dirty (compare current values to original), set `ShowDiscardPopup = True`.
   - Otherwise navigate back directly.
3. Add a [Confirmation Popup](./popup-modal-dialogs.md#pattern-1--confirmation-popup) bound to `ShowDiscardPopup` with Confirm = `(Previous Screen)`.

## Variations

### Pre-populating defaults in Create mode

If "New Request" should default `Priority = Medium` and `DueDate = today + 7`:

Add an `OnAfterFetch` to `GetRequestById`:

```
ScreenAction: GetRequestByIdAfterFetch
  IfNode (Sample_RequestId = NullIdentifier())
    True:
      AssignNode {
        GetRequestById.List.Current.Sample_Request.Priority = <medium-id-static-entity>
        GetRequestById.List.Current.Sample_Request.DueDate  = AddDays(CurrDate(), 7)
      }
    False: skip
  EndNode
```

Bound to the aggregate's `OnAfterFetch` in the aggregate definition.

### Server validation (in addition to client)

Client validation handles `Mandatory` / `MaxLength` / type. For business rules ("can't book a request in the past"):

1. In `OnSaveClick`, AFTER `IfNode(Form1.Valid) == True`, call your server action.
2. The server action returns a `ValidationResult` record (success bool + message text).
3. On failure, `AssignNode { Form1.SetValidationMessage("DueDate", validationResult.Message) }` and short-circuit.

### Read-only mode

If the same screen is reused for view-only display, add a `ReadOnly` Boolean input parameter and bind every Input's `Enabled` to `not ReadOnly`. Hide the Save button via `Visible = not ReadOnly`. Cancel becomes "Back".

### Multi-step (wizard)

For long forms, split into steps using the [`Wizard` pattern](../patterns/navigation.md#wizard--wizarditem). Each step is an `IfWidget` block gated on `CurrentStep = N`. The form-bound aggregate stays the same; only the visible inputs change per step.

## Anti-patterns

- **Per-field LocalVariables.** Bind inputs directly to `<Aggregate>.List.Current.<Entity>.<Field>` — far less plumbing.
- **Two separate screens for Create and Edit.** Use one screen with the Id parameter convention; saves duplication.
- **Custom validation messages without the Form widget.** Form's `Form1.Valid` and built-in validation messages handle 90% of cases for free.
- **Save button without `BuiltInValidations: "Client"`.** Without it, `Form1.Valid` is never computed and validation silently passes.
- **Cancel that doesn't call `(Previous Screen)`.** Hardcoding a destination breaks the back-stack on deep navigation.
- **Forgetting `IsMandatory: True` on the Id input parameter.** Callers can pass `NullIdentifier()` for Create, but the parameter itself is mandatory — the platform won't pass `Empty` by accident.

## Related

- [`../screen-templates.md#requestcreation-lines-39778-40621`](../screen-templates.md) — the source Screen Template.
- [`../widget-conventions.md#5-form-nesting`](../widget-conventions.md#5-form-nesting) — Form composition rules.
- [`../widget-conventions.md#3-qualified-expression-paths`](../widget-conventions.md#3-qualified-expression-paths) — Variable / Expression binding paths.
- [`./popup-modal-dialogs.md`](./popup-modal-dialogs.md) — confirmation popup recipe (for unsaved-changes warnings).
- [`../patterns/interaction.md#datepicker`](../patterns/interaction.md#datepicker) — DatePicker block reference.
- [`../patterns/navigation.md#wizard--wizarditem`](../patterns/navigation.md#wizard--wizarditem) — Wizard pattern (for multi-step variant).
