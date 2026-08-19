---
name: osui-recipe-popup-dialogs
description: Three OutSystems UI popup-modal recipes — confirmation, lookup search, and inline form data-entry. Use when adding modal dialogs (Are you sure?, pick from a list, inline create/edit) on Reactive Web or Phone App Template screens.
---

# Recipe — Popup Modal Dialogs

> **Recipe set:** end-to-end compositions for the three most common popup-modal use cases on OutSystems UI (Reactive Web + Phone App Template).
> **Widget:** `Popup` is a built-in OutSystems widget (NOT a `IMobileBlockInstanceWidget`).

This file contains three runnable recipes:

1. **Confirmation popup** — "Are you sure?" with Confirm/Cancel.
2. **Lookup search popup** — modal with a search input + scrollable results, returns a selection.
3. **Form data-entry popup** — modal with input fields for inline create/edit.

Each recipe includes the LocalVariables, ScreenActions, the Popup widget tree, and the trigger button. Drop them in, rename, wire up.

For inline (non-modal) feedback, use [`Alert`](../patterns/content.md#alert). For toast notifications, use [`Notification`](../patterns/interaction.md#notification). For overlays without a backdrop, use [`FloatingContent`](../patterns/content.md#floatingcontent) or `Popover`.

> **Mobile UI Template apps use a different stack.** ODC mobile apps built with the Mobile UI Template have a `Modal` **widget** (Ionic-based, with `header`/`content`/`footer` placeholders) instead of the `Popup` widget. This file covers the OutSystems UI / Reactive Web `Popup` widget. For Mobile UI's `Modal`, see [`../../mobile-ui/`](../../mobile-ui/).

## When to use each overlay

| Need | Pattern |
|---|---|
| Modal that blocks the page | `Popup` |
| "Are you sure?" before a destructive action | `Popup` (confirmation) |
| Inline create/edit without navigating away | `Popup` (form) |
| Pick a value from a long list | `Popup` (lookup) |
| Lightweight contextual overlay (no backdrop) | `Popover` (component) |
| Hover/focus help text | `Tooltip` |
| Toast (auto-dismiss, non-blocking) | `Notification` |

## Popup widget properties

`Popup` is a native OutSystems widget. Key properties:

| Property | Type | Purpose |
|---|---|---|
| `Name` | Text | Widget identifier. |
| `ShowPopup` | Boolean expression | Visibility — bind to a Boolean LocalVariable. |
| `Style` | Text | Use `"\"popup-dialog\""` for the standard modal style. |
| `content` | Widget[] | Body widgets (lowercase `content` per [widget conventions](../widget-conventions.md)). |
| `ExpandedInWebEditor` | Text | Design-time hint (`"True"` to expand in editor). |
| `CustomStyle` | Text | Optional CSS class. |

## Required supporting elements

Every Popup needs three things:

1. A **LocalVariable** `Show<Name>Popup` (Boolean, default `False`) — controls visibility.
2. A **ScreenAction** `Toggle<Name>Popup` — wired to close buttons; assigns `not <variable>`.
3. A **trigger element** elsewhere on the screen (Button or Link) that calls the toggle action.

## Pattern 1 — Confirmation popup

Modal with a message + Confirm/Cancel buttons. Used for delete confirmations, discard warnings.

**LocalVariable**

```
Name: ShowConfirmPopup, DataType: Boolean, DefaultValue: False
```

**ScreenAction `ToggleConfirmPopup`**

```
StartNode → AssignNode { ShowConfirmPopup = not ShowConfirmPopup } → EndNode
```

**Popup widget**

```jsonc
{
  "Name": "ConfirmPopup",
  "Object": "Popup",
  "ShowPopup": "ShowConfirmPopup",
  "Style": "\"popup-dialog\"",
  "ExpandedInWebEditor": "True",
  "content": [{
    "Object": "Container", "Style": "\"padding-base\"",
    "content": [
      { "Object": "Container", "Style": "\"font-size-h4 margin-bottom-base\"",
        "content": [{ "Object": "TextWidget", "Text": "Confirm Action" }] },
      { "Object": "Container", "Style": "\"margin-bottom-base\"",
        "content": [{ "Object": "TextWidget", "Text": "Are you sure you want to proceed?" }] },
      { "Object": "Container", "Style": "\"display-flex justify-content-end margin-top-base\"",
        "content": [
          { "Object": "Button", "Style": "\"btn margin-right-s\"",
            "content": [{ "Object": "TextWidget", "Text": "Cancel" }],
            "OnClick": [{ "Object": "BuiltinEvent", "BuiltInValidations": "None",
              "Destination": "ToggleConfirmPopup", "Transition": "Inherited" }] },
          { "Object": "Button", "Style": "\"btn btn-primary\"",
            "content": [{ "Object": "TextWidget", "Text": "Confirm" }],
            "OnClick": [{ "Object": "BuiltinEvent", "BuiltInValidations": "None",
              "Destination": "<ConfirmActionName>", "Transition": "Inherited" }] }
        ] }
    ]
  }]
}
```

**Trigger** — a Button on the parent screen with `OnClick` → `ToggleConfirmPopup`.

## Pattern 2 — Lookup search popup

Modal with search input + scrollable results table; selection writes back to parent screen and closes popup.

**LocalVariables**

```
ShowLookupPopup    Boolean   False
LookupSearchTerm   Text      ""
SelectedCode       Text      ""
SelectedName       Text      ""
```

**ScreenAggregate `GetLookupResults`** — filtered by `LookupSearchTerm` (use `like "%" + LookupSearchTerm + "%"`), sorted by display field.

**ScreenActions**

| Name | Purpose |
|---|---|
| `ToggleLookupPopup` | Flip `ShowLookupPopup`, reset `LookupSearchTerm = ""`. |
| `OnSearchChanged` | `RefreshDataNode GetLookupResults` to re-filter on each keystroke. |
| `SelectLookupItem(InCode, InName)` | Assign `SelectedCode`/`SelectedName`, set `ShowLookupPopup = False`. |

**Popup body** — Container with header + search Input (wired to `OnSearchChanged`) + `TableRecords` of `GetLookupResults.List` with a Select link per row. The Link's `OnClick` calls `SelectLookupItem` with `InCode = .Current.<Entity>.Code`, `InName = .Current.<Entity>.Name`.

**Trigger** — a "Search…" button next to the field that displays the selected value.

## Pattern 3 — Form data-entry popup

Modal with input fields for inline create/edit, without navigating to a separate screen.

**LocalVariables**

```
Show<Name>Popup    Boolean   False
<Entity>Record     <Entity>             // holds the record being edited
```

The `<Entity>Record` variable is a full entity row. Inputs bind to `<Entity>Record.<FieldName>` directly — no per-field LocalVariable needed.

**ScreenActions**

| Name | Purpose |
|---|---|
| `Toggle<Name>Popup` | Flip visibility, reset all `<Entity>Record.*` fields to clean defaults. |
| `Save<Name>` | Set parent FK on the record, call server CreateOrUpdate, refresh aggregate, close popup, reset fields. |

**Save action shape**

```
Start
  → Assign { <Entity>Record.<ParentFKId> = <ParentIdInputParam> }
  → ExecuteServerActionNode <Entity>CreateOrUpdate(Source = <Entity>Record)
  → RefreshDataNode <ParentAggregate>
  → Assign { Show<Name>Popup = False; reset all <Entity>Record fields }
  → End
```

**Popup body** — Container with title + a sequence of `Container > Label + Input` blocks bound to `<Entity>Record.<Field>` + Cancel/Save button row.

## Critical rules

1. **One LocalVariable per popup.** Don't reuse a `Show*` variable across popups — each needs its own.
2. **Embed popups in the screen at creation time.** Adding complex widget subtrees to existing screens after creation can be unreliable. Place the `Popup` widget at the end of the screen's widget tree (after `MainContent` content).
3. **Reset form fields on toggle.** The toggle action MUST reset the bound entity record fields to clean defaults — otherwise stale data from a cancelled edit appears next time.
4. **Set parent FK before save.** When the popup creates a child record, assign `<Record>.<ParentFKId> = <ParentIdInputParam>` BEFORE the server-action call. Omitting this creates orphan records with `NullIdentifier()`.
5. **Lookup popups close on selection.** Set `Show<Name>Popup = False` inside the selection action — don't require a separate close click.
6. **Wire search inputs to refresh the aggregate on every change** (`OnChange` → ScreenAction → `RefreshDataNode`) for real-time filtering.
7. **Don't use `Popup` for transient feedback.** Use `Notification` (toast) or `Alert` (inline). Modals interrupt the user — reserve them for action confirmation, focused input, or selection.

## Accessibility notes

- `Popup` traps focus inside itself while open and restores it to the trigger on close. Don't manually move focus.
- Always have a labeled close button (Cancel/X) — don't rely on background-click alone, since it's not keyboard accessible.
- The first focusable element in the popup body receives focus on open. Make sure it's a sensible target (the first input, or the Cancel button for confirmations).
- Popup title should be a heading (`AdvancedHtml Tag: "h2"` or styled `Container`) so screen readers announce it.
- The Confirm button on destructive popups should be styled `btn btn-primary` (or `btn-destructive` if you have one) — never make Cancel the more prominent visual choice.
