---
name: osui-recipe-buttons-and-clickables
description: When to use the Button widget vs. Link vs. a Container with click handler. Covers primary CTAs, header action buttons, circular icon buttons, and link-styled actions. Use whenever the request mentions "button", "CTA", "action button", "click to …", or any clickable element.
---

# Recipe — Buttons and Clickables

> **Goal:** make every clickable surface a real interactive widget (`Button`, `Link`, `ButtonGroup`) — **never** a `Container` with an `OnClick` event styled to look like a button. Custom-styled `Container`s lose accessibility, focus rings, keyboard activation, and theme integration.

## When to use this recipe

This recipe covers **every clickable element on a screen.** If you're about to attach an `OnClick` to a `Container`, stop and re-read this.

## Decision tree

| Element kind | Use |
|---|---|
| Primary action ("Save", "Send money", "Sign up") | `Button` widget with `Style: "btn btn-primary"` |
| Secondary action ("Cancel", "Back") | `Button` widget with `Style: "btn"` (default) |
| Custom-styled button (design-system pill, gradient CTA, brand-tinted variant) | `Button` widget with `Style: "btn <custom-class>"` (e.g. `"btn pill-secondary"`). **Keep `btn`.** Drop `btn-primary` ONLY if the button is not the primary action. |
| Tertiary / inline action ("See all", "More info", "Learn how") | `Link` widget |
| Icon-only action ("Show PIN", "Freeze card", a circular nav button) | `Button` widget with an `Icon` widget inside, `Style: "btn btn-icon"` (or the design-system equivalent class) |
| Group of related actions (segmented buttons, paired Save / Cancel) | `ButtonGroup` containing `ButtonGroupItem`s |
| Whole row clickable (e.g. a list row that opens detail) | Wrap the row in a `Link` with `OnClick → DestinationScreen`. Don't put `OnClick` on the row `Container`. |

> **The `btn` base is mandatory on every `IButton`.** It supplies cursor, focus ring, padding, base typography, and hover/active/disabled transitions — the *basic functionality* of a button. The `.btn-primary` / `.btn-cancel` / `.btn-error` etc. modifiers are colorways layered on top and CAN be omitted (when the button is not that variant). A spec entry of `extended_class: "pill-secondary"` on a Button must be emitted as `Style = "\"btn pill-secondary\""` — NEVER as `Style = "\"pill-secondary\""`. The latter drops focus + padding + transitions and produces a bare `<button>` element wearing only the custom class. See [`../styles-and-utilities.md#buttons`](../styles-and-utilities.md#buttons) for the full rule.

## Why a `Container` with `OnClick` is wrong

- ❌ Not focusable via keyboard (no `tabindex`, no native button semantics).
- ❌ No focus ring → fails accessibility audits.
- ❌ Doesn't fire on Enter/Space.
- ❌ Screen readers don't announce it as a button.
- ❌ Validation in TrueChange may not catch it, but reviewers will.

> **Default child widgets:** `IButton` and `ILink` ship with a default `ITextWidget` child auto-created at instantiation. **Mutate the existing one** rather than `Delete()` + recreate — deleting the default and adding a new TextWidget tends to leave a null reference somewhere in the widget chain.

## C# template — Primary CTA

```csharp
// "Send money" CTA in the sidebar
var sendMoneyBtn = parentContainer.CreateWidget<IButton>("SendMoneyBtn");
sendMoneyBtn.Style = "\"btn btn-primary btn-large\"";          // expression — note the escaped quotes
sendMoneyBtn.OnClick = new BuiltinEvent { Destination = sendMoneyScreen /* or a ScreenAction */ };

// Mutate the default text widget (don't delete + recreate)
var btnText = sendMoneyBtn.Widgets.OfType<ITextWidget>().First();
btnText.Value = "\"Send money\"";

// Optional leading icon — added BEFORE the text widget if you want it on the left
var icon = sendMoneyBtn.Widgets.CreateWidget<IIcon>("SendIcon");
icon.IconName = "Entities.IconType.Send";
```

## C# template — Icon-only circular action

```csharp
// "Show PIN" / "Freeze card" / "Card details" buttons next to the card visual
var showPin = actionsContainer.CreateWidget<IButton>("ShowPinBtn");
showPin.Style   = "\"btn btn-icon btn-circle\"";
showPin.OnClick = new BuiltinEvent { Destination = showPinAction };

// The default ITextWidget can be cleared (set to "") if you only want an icon.
showPin.Widgets.OfType<ITextWidget>().First().Value = "\"\"";
showPin.Widgets.CreateWidget<IIcon>("PinIcon").IconName = "Entities.IconType.Lock";

// Below the icon, a small label (separate widget — NOT part of the button)
var label = actionsContainer.CreateWidget<IText>("ShowPinLabel");
label.Value = "\"Show PIN\"";
```

## C# template — Inline link action ("See all")

```csharp
var seeAll = txHeader.CreateWidget<ILink>("SeeAllLink");
seeAll.Style   = "\"link link-subtle\"";
seeAll.OnClick = new BuiltinEvent { Destination = transactionsListScreen };  // REQUIRED; ILink.OnClick can't be empty.

// Mutate the default ITextWidget rather than Delete() + recreate
var linkText = seeAll.Widgets.OfType<ITextWidget>().First();
linkText.Value = "\"See all\"";
```

## Anti-patterns to AVOID

❌ **Dropping the `btn` base class when applying a custom class.** Setting `IButton.Style = "\"pill-secondary\""` (just the custom class) strips the cursor, focus ring, padding, hover transition, and disabled-state styling — the button renders as a styled `<button>` element with no platform behavior. Always concat: `IButton.Style = "\"btn pill-secondary\""`. The `btn-primary` modifier can be dropped if the button isn't primary, but `btn` itself is non-negotiable. This shows up most often when the agent reads `outsystems_hints.extended_class: "pill-secondary"` and writes only the custom class — REMEMBER: for `IButton` the `extended_class` is APPENDED to `btn`, not used in isolation.

❌ `<Container OnClick="DoX" Style="my-button-class">`. Replace with `<Button OnClick="DoX">`.

❌ A `Link` widget with no `OnClick.Destination`. TrueChange validation fails. If the link is decorative / TODO, point it at the current screen or a stub `ScreenAction` that does nothing — never leave it empty.

❌ Hand-rolled icon buttons using `<Container>` + `<Image>` + click handler. Use `Button` with an `Icon` inside; the styling classes (`btn-icon`, `btn-circle`) already exist.

❌ Using a `Button` and then overriding its appearance entirely with a custom `CustomStyle` — defeats the theme. Use the existing button utility classes and theme variables.

## Related

- For toggle buttons (on/off pair, "All / Active / Archived"), use `ButtonGroup` + `ButtonGroupItem` ([`../patterns/utilities.md`](../patterns/utilities.md)).
- For a click-to-toggle action (Like / Bookmark), use `Button` with two Style branches via expression on the button's state variable.
- For external links (open in new tab), use `Link` with `OpensIn = New Tab`.
- For form submit buttons, use `Button` with `IsSubmit: True` inside a `Form`.
