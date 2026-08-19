---
name: osui-recipe-info-banner
description: How to build informational banners (delivery status, promo, "tip / warning / success" notices) using Alert or Notification blocks. Use when the request mentions "info banner", "promo block", "status banner", "callout / tip card", or "your card should arrive by …".
---

# Recipe — Info Banner

> **Goal:** a contextual contextual notice with icon + text + optional action link. The OutSystems UI canonical shape is `Alert` (inline) or `Notification` (toast / dismissible) — **never** a hand-built `Container` mimicking it.

## When to use this recipe

Trigger phrases for **`Alert`** (inline, persistent):

- "info banner", "tip card", "callout"
- "your card should arrive by Thursday" (delivery / status notice)
- "Earn $115 — invite friends" (promo / CTA banner)
- "warning: …", "success: …", "error: …"

Trigger phrases for **`Notification`** (toast, auto-dismiss):

- "show a toast", "show a snackbar", "show a confirmation message"
- "after save, notify the user"

## What you'll build (Alert variant)

```
Alert (block instance)
  Alert.AlertType  = Entities.Alert.Success | Error | Warning | Info        ← NOT AlertColor, NOT Entities.Color.*
  Alert.IsDismissible = False  (or True if user can close it)
  └── Alert.MessageText (placeholder — NOT "Content")
        ├── Title text
        ├── Description text
        └── Optional: Link / Button for the action ("Learn how", "More info")
```

### Variant — message-left / action-right (canonical "Alert with action" layout)

When the design shows the alert message and an inline action link sitting at opposite ends of the alert body (most common shape — "Your card arrives Thursday" with a "Track →" link on the right), wrap MessageText's children in **one Container with `display-flex justify-content-space-between`** + `Width = "(fill parent)"`. Without the flex container, the action Link sits inline-flow next to the text and won't right-align. From the `AlertWithAction` reference block:

```
Alert (AlertType=..., IsDismissible=False)
  └── MessageText placeholder
        └── Container Style="display-flex justify-content-space-between" Width="(fill parent)"
              ├── TextWidget       "Your card arrives Thursday"
              └── Link             "Track →"  (OnClick wired)
```

```csharp
// Inside the MessageText placeholder, add the flex wrapper first.
var row = bannerContent.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
row.SetStyle("\"display-flex justify-content-space-between\"");
row.Width = "(fill parent)";

var msg = row.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
msg.Text = "Your card arrives Thursday";

var trackLink = row.CreateWidget<ServiceStudio.Plugin.NRWidgets.ILink>();
// Link ships with a default ITextWidget — mutate it, don't add a second one.
var trackText = trackLink.Widgets.OfType<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>().First();
trackText.Value = "\"Track →\"";
trackLink.OnClick.Destination = onTrackAction;
```

For multi-line messages (title + description above the action), drop the flex container and stack a Container (text block) above the Link inside MessageText.

> ⚠️ **Two empirically-verified gotchas the static signatures do not warn you about:**
> - The arg is `AlertType` (NOT `AlertColor`); its value comes from `Entities.Alert.*` (NOT `Entities.Color.*`).
> - The placeholder is `MessageText` (NOT `Content`). Trying `p.Placeholder == "Content"` on an Alert instance returns `null` and the next `.CreateWidget(...)` throws a NullReferenceException.

## Required references

Both blocks live in `OutSystemsUI`, in different flows. Look them up via the canonical pattern in [`../blocks-index.md#how-to-look-up-an-os-ui-block-the-lookup-pattern`](../blocks-index.md#how-to-look-up-an-os-ui-block-the-lookup-pattern).

| Block | OutSystemsUI flow | Key args | Key placeholders |
|---|---|---|---|
| `Alert` | `Content` | `AlertType` (value from `Entities.Alert` — Success / Error / Info / Warning), `IsDismissible`, `ExtendedClass` | `MessageText` |
| `Notification` | `Interaction` | `Position`, `IsOpen`, `Color`, `AutoCloseTime` | `Content` |

> ⚠️ Common mistakes: parameter is `AlertType` (NOT `AlertColor`), and its value is `Entities.Alert.<Success|Error|Info|Warning>` (NOT `Entities.Color.*`). Placeholder lookup uses **bare** name `"MessageText"` (NOT `"Content"`, NOT `"Alert.Content"`) — see [`../blocks-index.md#placeholder-naming-runtime-vs-patch-json`](../blocks-index.md#placeholder-naming-runtime-vs-patch-json).

For full API see [`../patterns/content.md#alert`](../patterns/content.md#alert) and [`../patterns/interaction.md#notification`](../patterns/interaction.md#notification).

## C# template (Alert)

```csharp
// 1) Look up Alert signature from OutSystemsUI/Content
var app          = eSpace.GetESpace();
var outSystemsUI = app.References.Named("OutSystemsUI");
var contentFlow  = outSystemsUI.MobileFlows.Named("Content");
var alertSig     = contentFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "Alert");

// 2) Instantiate inside the parent placeholder (e.g. at the bottom of MainContent)
// SetArgumentValue takes (IInputParameterSignature, ExpressionDefinition).
// Look up the parameter by BARE name; strings implicitly convert to ExpressionDefinition.
var banner = parentContainer.CreateWidget<IMobileBlockInstanceWidget>("CardArrivalBanner");
banner.SourceBlock = alertSig;
banner.SetArgumentValue(banner.SourceBlock.InputParameters.Named("AlertType"),     "Entities.Alert.Info");
//                       ⚠️ "AlertType" (NOT "AlertColor"), and the value comes from
//                          the `Alert` static entity (Success / Error / Info / Warning),
//                          NOT from `Entities.Color.*`.
banner.SetArgumentValue(banner.SourceBlock.InputParameters.Named("IsDismissible"), "False");

// 3) Populate the Alert.MessageText placeholder
// ⚠️ The placeholder is "MessageText", NOT "Content". This is the #1 trap on Alert.
// Runtime PlaceholdersContent uses BARE names. See blocks-index.md.
var bannerContent = banner.PlaceholdersContent
    .FirstOrDefault(p => p.Placeholder == "MessageText");

var title = bannerContent.CreateWidget<IAdvancedHtml>("BannerTitle");
title.Tag = "strong";
// Set the inner text via the AdvancedHtml content collection per its API.

var actionLink = bannerContent.CreateWidget<ILink>("MoreInfoLink");
// Link ships with a default ITextWidget — mutate it instead of Delete()/recreate.
var linkText = actionLink.Widgets.OfType<ITextWidget>().First();
linkText.Value = "\"More info\"";
// IMPORTANT: ILink.OnClick MUST have a Destination (screen / URL / no-op ScreenAction) — see widget-conventions.md.
```

## C# template (Notification — toast)

```csharp
// Define a LocalVariable IsToastOpen (Boolean, default False).
// In a ScreenAction, set IsToastOpen = True; Notification handles auto-close.

var app          = eSpace.GetESpace();
var outSystemsUI = app.References.Named("OutSystemsUI");
var interFlow    = outSystemsUI.MobileFlows.Named("Interaction");
var notificationSig = interFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "Notification");

var toast = screen.CreateWidget<IMobileBlockInstanceWidget>("SaveToast");
toast.SourceBlock = notificationSig;
toast.SetArgumentValue(toast.SourceBlock.InputParameters.Named("IsOpen"),        "IsToastOpen");
toast.SetArgumentValue(toast.SourceBlock.InputParameters.Named("Color"),         "Entities.Color.Success");
toast.SetArgumentValue(toast.SourceBlock.InputParameters.Named("Position"),      "Entities.Position.Bottom");
toast.SetArgumentValue(toast.SourceBlock.InputParameters.Named("AutoCloseTime"), "3000");

var toastContent = toast.PlaceholdersContent
    .FirstOrDefault(p => p.Placeholder == "Content");  // BARE name
toastContent.CreateWidget<IText>("Msg").Value = "\"Saved successfully\"";
```

## Anti-patterns to AVOID

❌ `Container` with `Style: "promo-banner"` and a custom CSS rule with `background-color`, `border-left`, padding, an icon image, and a link. **That's what `Alert` is** — it gets you semantic colors, icon presets, dismissibility, and consistent OutSystems UI chrome for free.

❌ Using `Alert` but burying the "Learn more" / "More info" action as a `Container` styled as a link instead of using a `Link` widget with proper `OnClick` destination. Validation will fail (Link.OnClick is required).

❌ Hardcoding banner colors with hex values in the StyleSheet. Use `Alert.AlertType = Entities.Alert.<Success|Error|Warning|Info>` — the theme decides the actual color.

❌ Looking up `Alert.AlertColor` or trying to set the value from `Entities.Color.*`. The arg name is `AlertType` and the value comes from `Entities.Alert.*`. Cross-checking via `Alert.SourceBlock.InputParameters.Named("AlertColor")` returns null and the next call throws.

❌ Looking up the Alert's content placeholder as `"Content"`. Alert's placeholder is **`MessageText`** — the `Content` lookup returns null and the next `.CreateWidget(...)` throws. Confirmed empirically against live Alert signatures.

❌ Reaching for `Notification` when the banner is **persistent** (not auto-dismissed). Notification is for ephemeral toasts. Persistent inline banners are `Alert`.

## Related

- For a "tip" with rich content (illustrations, multiple actions), wrap an `Alert` body inside a `Card` for a heavier surface.
- For modal confirmation/error dialogs, use `Popup` ([`./popup-modal-dialogs.md`](./popup-modal-dialogs.md)).
- For a chip/pill (small status label, not a banner), use `Tag` ([`../patterns/content.md#tag`](../patterns/content.md#tag)).
