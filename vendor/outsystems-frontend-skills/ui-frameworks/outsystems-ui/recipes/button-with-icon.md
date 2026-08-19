---
name: osui-recipe-button-with-icon
description: How to compose a Button with a leading (or trailing) Phosphor icon — the canonical "icon + label" CTA shape. Covers the delete-defaults rule when ordering matters, the column-gap-s spacing class, OnClick wiring to a screen action, and the upgrade to a reusable parameterized block. Use when the request mentions "Send money button with paper-plane icon", "primary CTA with leading icon", "trailing arrow on the link", "icon button", or any clickable affordance combining an icon and a label.
---

# Recipe — Button with Icon

> **Goal:** the canonical OutSystems UI shape for a button that combines an icon and a label — Phosphor icon, theme-correct spacing, proper OnClick wiring. This is one of the highest-frequency CTA patterns in any banking / SaaS / dashboard UI.

> **When to use:** anywhere the request describes a primary or secondary CTA with both an icon and text — "Send money", "Add new", "Download report", "Get started", "Learn more →". Also for icon-only action buttons with no visible label (text becomes `aria-label`).

## Trigger phrases

- "Send money button with paper-plane icon"
- "Primary CTA with leading icon"
- "Trailing arrow on the [Continue / View details / Next] button"
- "Icon button" / "icon-only button" (round, no label)
- "Button + plus icon to add new"
- "Download / Upload / Share button"

## What it produces

A **`IButton`** widget (`ServiceStudio.Plugin.NRWidgets.IButton`) containing:
- `IIcon` (Phosphor name, `IconSize=FontSize`, weight `regular`)
- `ITextWidget` (the label)

Styled with `btn btn-primary column-gap-s` (or a button variant — see below). `OnClick.Destination` wired to a screen action.

## Skeleton tree

```
Button   Style="btn btn-primary column-gap-s"   OnClick.Destination = SomeAction
├── Icon (Phosphor: "paper-plane-tilt", FontSize, weight=regular)
└── TextWidget "Send money"
```

The `column-gap-s` class on the button is what gives the icon-text spacing. Omit it and the icon glues straight to the text.

## Building it (Model API)

```csharp
// 1) The screen action the button will trigger.
//    Declare BEFORE the button so OnClick.Destination has a valid target.
var sendMoneyAction = screen.CreateScreenAction("SendMoneyOnClick");
var saStart = sendMoneyAction.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
var saEnd = sendMoneyAction.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>()
    .ConnectedBelow(saStart, 4320);
// (Add more nodes between Start and End once you wire the real behavior.)

// 2) The Button widget. Style supplies variant + spacing.
var button = parentContainer.CreateWidget<ServiceStudio.Plugin.NRWidgets.IButton>();
button.SetStyle("\"btn btn-primary column-gap-s\"");
button.SetEnabled("True");

// 3) CRITICAL: delete the Button's default children before adding our own.
//    Default child is a single ITextWidget at index 0. If we mutate it instead,
//    a new IIcon we add ends up AFTER the existing text → icon renders to the right
//    of the label, not before. To control order (icon first, text second), wipe
//    and recreate.
button.Widgets.ToList().ForEach(w => w.Delete());

// 4) Icon — Phosphor name, FontSize, regular weight.
var icon = button.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
icon.Icon = "paper-plane-tilt";
icon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
icon.Weight = "regular";

// 5) Label — plain TextWidget child of the Button.
var label = button.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
label.Text = "Send money";

// 6) Wire OnClick to the screen action.
button.OnClick.Destination = sendMoneyAction;
button.OnClick.BuiltInValidations = OutSystems.Model.Enumerations.ValidationBehavior.None;
```

## The delete-defaults vs. mutate decision

`IButton` and `ILink` ship with a default `ITextWidget` child. The decision is:

| You want | Do | Why |
|---|---|---|
| Just change the label text on a plain button (no icon) | **Mutate the default** — `(ITextWidget)button.Widgets.First()` and set `.Text` | The single default child is in the right place; recreating is unnecessary churn. |
| Icon + label in a specific order (icon first, text second) | **Delete defaults, then create fresh** as in the recipe above | The default `ITextWidget` is at index 0; any `IIcon` you add lands at index 1 and renders to the RIGHT of the text. To put the icon first, wipe and rebuild. |
| Trailing icon (text first, then icon) | **Mutate the default** for the text, then `CreateWidget<IIcon>` after | The default child stays as the text at index 0; the new icon goes at index 1. No deletion needed. |
| Icon only (no visible label, accessibility via `aria-label`) | **Delete defaults**, create only the `IIcon`, set `ExtendedProperties` for `aria-label` | The default `ITextWidget` would render an empty span; remove it. |

## Variants

### Trailing icon (e.g. "Continue →")

```csharp
button.SetStyle("\"btn btn-primary column-gap-s\"");

// Mutate the default text child.
var label = (OutSystems.Model.UI.Mobile.Widgets.ITextWidget)button.Widgets.First();
label.Text = "Continue";

// Append the trailing icon.
var icon = button.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
icon.Icon = "arrow-right";
icon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
icon.Weight = "regular";
```

### Icon-only round button (no visible label)

```csharp
button.SetStyle("\"btn btn-icon btn-secondary\"");
button.Widgets.ToList().ForEach(w => w.Delete());

var icon = button.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
icon.Icon = "gear";
icon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;

// Accessibility: the screen reader needs a label. Set aria-label via ExtendedProperties.
button.ExtendedProperties.Add(new ExpressionDefinition.RecordLiteral(fields: [
    ("Property", "\"aria-label\""),
    ("Value", "\"Settings\"")
]));
```

### Trailing icon on a Link (e.g. "Learn more →")

For lighter-weight inline actions, use `ILink` instead of `IButton`:

```csharp
var link = container.CreateWidget<ServiceStudio.Plugin.NRWidgets.ILink>();
link.SetStyle("\"link\"");

var linkText = (OutSystems.Model.UI.Mobile.Widgets.ITextWidget)link.Widgets.First();
linkText.Text = "Learn more";

var arrow = link.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
arrow.Icon = "arrow-right";
arrow.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;

link.OnClick.Destination = learnMoreAction;
```

See [`recipes/buttons-and-clickables.md`](buttons-and-clickables.md) for the full Button vs. Link decision.

## Button style variants

Set via `button.SetStyle("\"btn <variant> column-gap-s\"")`:

| Variant | Use for |
|---|---|
| `btn-primary` | The single most important CTA on the screen / region. One per region max. |
| `btn-secondary` | Secondary actions sitting next to a primary. |
| `btn-tertiary` / no variant | Low-emphasis ghost button. |
| `btn-success` / `btn-danger` / `btn-warning` | Semantic-color CTAs (Confirm purchase, Delete account, Override). |
| `btn-icon` | Round icon-only button (combine with one of the above for color). |
| `btn-large` / `btn-small` | Size modifiers — combine with a variant. |

Always include `column-gap-s` when there's both an icon and a text label.

## Common pitfalls

❌ **Emoji as the icon** — `label.Text = "📨 Send money"`. The emoji doesn't respect theme color, doesn't scale with typography, and isn't accessible. Use a real `IIcon` widget.

❌ **`Container` styled as a button** with `cursor: pointer` and an `onclick` handler. Use the actual `IButton` widget — gets you focus states, keyboard activation (Enter/Space), correct ARIA role, validation behavior, and disabled-state styling for free.

❌ **Skipping `column-gap-s`** in the button's `Style`. Without it, the icon and label render flush against each other — looks broken. Add it whenever the button has BOTH an icon AND text.

❌ **Mutating the default `ITextWidget` and ALSO adding an Icon expecting it to render first.** The default text stays at index 0; your Icon lands at index 1 → renders to the right. For leading-icon order, delete defaults and rebuild as siblings.

❌ **Adding a fresh `ITextWidget` to a button WITHOUT first mutating or deleting the default.** This is the "Button + Add Money" / "Button Send" failure: the button now has TWO text children — the default literal `"Button"` text at index 0, and your new label at index 1 — so the rendered button reads `"Button <yourlabel>"`. **Every `IButton` and `ILink` ships with exactly one `ITextWidget` child already.** The two correct patterns are:

```csharp
// PATTERN A — mutate the default (preferred for plain text-only buttons):
var label = (OutSystems.Model.UI.Mobile.Widgets.ITextWidget)button.Widgets.First();
label.Value = ExpressionDefinition.Parse(eSpace, "\"Add Money\"");

// PATTERN B — wipe and rebuild (only when you need icon-then-text order):
foreach (var w in button.Widgets.ToList()) w.Delete();
var icon  = button.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IIcon>();
var label = button.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
```

Tripwire after any button work: search the changed.oml for the literal string `"Button Add"` or `"Button Send"` etc. — if it shows up, you used neither pattern and the default text is leaking into the rendered UI.

❌ **Leaving `OnClick.Destination` unset.** `IButton` validation REQUIRES a destination. If you don't have a real action yet, create an empty stub (`Start → End`) and wire to it; replace later.

❌ **`IconSize` other than `FontSize`** on a button icon. The fixed-pixel sizes break theme typography scaling. `FontSize` is correct virtually always.

❌ **Wrapping the icon in a Container before adding it to the button.** The Button's flex layout (with `column-gap-s`) handles the icon-text spacing directly. An inner Container disrupts the gap and adds an extra layout box.

❌ **Setting `text-primary` / `text-success` on the icon to recolor it.** The button's `btn-*` variant already controls the icon color — picking `btn-primary` colors the icon as primary, `btn-danger` as danger, etc. Don't override; trust the variant.

## Related

- [`recipes/buttons-and-clickables.md`](buttons-and-clickables.md) — Button vs. Link vs. clickable Container decision tree.
- [`patterns/interaction.md`](../patterns/interaction.md) — sliders, dropdowns, sheets and other interactive blocks beyond Button.
