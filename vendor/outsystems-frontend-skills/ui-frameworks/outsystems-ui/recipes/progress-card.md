---
name: osui-recipe-progress-card
description: How to build a progress card showing usage / quota / goal completion — uses CardSectioned with a two-column title (label + action link) and a content body that pairs a usage row with a ProgressBar. Use when the request mentions "spending limit", "goal progress", "quota usage", "X of Y", a Card with a progress bar, or a "request increase" / "manage" link in a card header.
---

# Recipe — Progress Card

> **Goal:** the canonical pattern for a card that shows progress toward a quota/goal — title row with a right-aligned action link, a "X used of Y" row, a ProgressBar, and an optional footer note.

> **When to use:** spending caps, storage quotas, plan usage, monthly budget tracking, goal trackers — any "X used of Y" surface where the visual is a labeled progress bar inside a card with a title and an action.

## Trigger phrases

- "Spending limit / spending cap card"
- "Quota / usage progress / monthly budget"
- "Goal progress card with progress bar"
- "X used of Y / X out of Y" with a progress visual
- "Request increase" / "Manage" link in a card header

## What it produces

A `CardSectioned` block (Title / Content / Footer) where:
- **Title** uses `Columns2`: label text on the left (`"Spending Limit"`), a right-aligned `Link` with an attached screen action on the right (`"Request Increase"`).
- **Content** has a usage row ("€1,240 used" + "of €3,000" muted) followed by a `ProgressBar` block (from `OutSystemsUI/Numbers`).
- An optional muted footer line ("Monthly spend: €1,240.00").

## Skeleton tree

```
Block "ProgressCard"
├── ScreenAction "RequestIncreaseOnClick"   ← Start → End (empty stub for now)
└── Widgets
    └── CardSectioned (from OutSystemsUI/Content)
        ├── Title placeholder
        │   └── Columns2 (defaults — Base gutter, BreakColumns.None)
        │       ├── Column1 → TextWidget "Spending Limit" (font-size-base)
        │       └── Column2 → Container (text-align: right)
        │                     └── Link (font-size-s, OnClick → RequestIncreaseOnClick)
        │                         └── TextWidget (default child) "Request Increase"
        ├── Content placeholder
        │   ├── Container (display-flex justify-content-space-between margin-bottom-base)
        │   │   ├── TextWidget "€1,240 used"
        │   │   └── TextWidget (text-neutral-6) "of €3,000"
        │   ├── ProgressBar (from OutSystemsUI/Numbers, Thickness=6, Progress=40, OptionalConfigs={…})
        │   └── Container (margin-top-base)
        │       └── TextWidget (text-neutral-6 font-size-xs) "Monthly spend: €1,240.00"
        └── Footer placeholder (empty)
```

## Building it (Model API)

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var dashboards = app.MobileFlows.Named("DashboardsAndAnalytics");
    var outSystemsUI = app.References.Named("OutSystemsUI");
    var content = outSystemsUI.MobileFlows.Named("Content");
    var adaptive = outSystemsUI.MobileFlows.Named("Adaptive");
    var numbers = outSystemsUI.MobileFlows.Named("Numbers");

    var block = dashboards.CreateBlock("ProgressCard");

    // 1) Declare the screen action FIRST, before referencing it from the Link.
    var requestIncrease = block.CreateScreenAction("RequestIncreaseOnClick");
    var raStart = requestIncrease.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
    var raEnd = requestIncrease.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(raStart, 4320);

    // 2) Outer CardSectioned (3 placeholders: Title / Content / Footer).
    var cardSectionedSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("CardSectioned");
    var card = block.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    card.SourceBlock = cardSectionedSig;
    // CardSectioned args (IsVertical / ImagePadding / UsePadding / ExtendedClass) all accept null → defaults.

    // 3) Title placeholder: Columns2 with label on the left and action link on the right.
    var titlePh = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Title");

    var columns2Sig = adaptive.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Columns2");
    var cols = titlePh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    cols.SourceBlock = columns2Sig;
    // Columns2 args left at defaults — Base gutter, BreakColumns.None.

    var col1 = cols.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Column1");
    var titleText = col1.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    titleText.SetStyleClasses("\"font-size-base\"");
    titleText.Text = "Spending Limit";

    var col2 = cols.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Column2");
    var linkWrap = col2.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    linkWrap.CustomStyle = "text-align: right;";

    var link = linkWrap.CreateWidget<ServiceStudio.Plugin.NRWidgets.ILink>();
    link.SetStyle("\"font-size-s\"");

    // Link ships with a default ITextWidget child — mutate it, don't create a new one.
    var linkText = (OutSystems.Model.UI.Mobile.Widgets.ITextWidget)link.Widgets.First();
    linkText.Text = "Request Increase";

    // Wire the link's OnClick to the screen action declared in step 1.
    link.OnClick.Destination = requestIncrease;

    // 4) Content placeholder: usage row + ProgressBar + footnote.
    var contentPh = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");

    // 4a) Usage row.
    var usageRow = contentPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    usageRow.SetStyle("\"display-flex justify-content-space-between margin-bottom-base\"");

    var used = usageRow.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    used.Text = "€1,240 used";

    var of = usageRow.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    of.SetStyleClasses("\"text-neutral-6\"");
    of.Text = "of €3,000";

    // 4b) ProgressBar block. OptionalConfigs is a record literal — note the syntax.
    var progressBarSig = numbers.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("ProgressBar");
    var pb = contentPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    pb.SourceBlock = progressBarSig;
    pb.SetArgumentValue(progressBarSig.InputParameters.Named("Thickness"), "6");
    pb.SetArgumentValue(progressBarSig.InputParameters.Named("Progress"), "40");   // 0–100
    pb.SetArgumentValue(progressBarSig.InputParameters.Named("OptionalConfigs"),
        new ExpressionDefinition.RecordLiteral(fields: [
            ("Shape", null),
            ("AnimateInitialProgress", "True"),
        ]));
    // ProgressColor / TrailColor / ExtendedClass left at defaults.

    // 4c) Footnote.
    var footnoteRow = contentPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    footnoteRow.SetStyle("\"margin-top-base\"");
    var footnote = footnoteRow.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    footnote.SetStyleClasses("\"text-neutral-6 font-size-xs\"");
    footnote.Text = "Monthly spend: €1,240.00";

    // Footer placeholder is left empty.
}
```

## Decision points when specializing

| Decision | Default | Override when |
|---|---|---|
| **Outer wrapper** | `CardSectioned` (so Title/Content/Footer are clearly separated) | `Card` (single Content placeholder) when the action link can live inline with the title text and there's no separate footer. |
| **Title layout** | `Columns2` (label left, link right) | Plain `TextWidget` if there's no action; `Columns3` if there's a label + value preview + link (rare). |
| **`Progress` arg** | A literal `"40"` for static demos | An expression like `"GetUsage.Used / GetUsage.Limit * 100"` against an aggregate when wired to real data. |
| **`Thickness`** | `"6"` (compact bar, fits inline with a card) | `"10"`–`"12"` for a hero progress bar that's the main focal point of the card. |
| **`OptionalConfigs.AnimateInitialProgress`** | `"True"` (subtle entry animation) | `"False"` if the card is rendered far below the fold and animation feels stale by the time the user scrolls there. |
| **`ProgressColor`** | unset → theme primary | `"Entities.Color.Red"` for over-quota, `"Entities.Color.Green"` for under-budget, `"Entities.Color.Orange"` for warning thresholds. Set via `SetArgumentValue` with the entity literal expression. |
| **Footer placeholder** | empty | Drop a `Separator` + small "View details" link if the card needs a secondary action. |

## Common pitfalls

❌ **Building a `<div>` with custom CSS instead of using `ProgressBar`.** The OS UI block respects theme color tokens, has the right ARIA roles, and animates correctly. A custom div doesn't.

❌ **Wiring the link before the screen action exists.** Build order: declare the `ScreenAction` (with its Start/End nodes) → then create the `Link` and set `link.OnClick.Destination = action`. Reverse order leaves a null reference.

❌ **Creating a second `TextWidget` inside the Link instead of mutating the default child.** `Link` ships with one `ITextWidget` already — `(ITextWidget)link.Widgets.First()` and edit `.Text`. Adding a second creates two text nodes.

❌ **Missing the `OptionalConfigs` shape.** `ProgressBar.OptionalConfigs` is a record with two fields (`Shape`, `AnimateInitialProgress`). Both can be `null` (defaults) but the record itself must be supplied as a `RecordLiteral` — passing `null` for the whole arg works too if you accept all defaults.

❌ **Putting the link inside the Title's Column1 alongside the title text.** The right-aligned action requires a dedicated Column2 with `text-align: right`. Trying to right-float the link via CSS inside Column1 is fragile across breakpoints.

❌ **Forgetting `ConnectedBelow(start, dy)` on the End node.** Empty action stubs need both nodes connected — `start.Target = end` (or use `.ConnectedBelow(start, 4320)` shorthand) — otherwise validation flags an unreachable End.

## Related

- [`patterns/numbers.md`](../patterns/numbers.md) — `ProgressBar`, `ProgressCircle`, `Counter` arg reference.
- [`patterns/adaptive.md`](../patterns/adaptive.md) — `Columns2` for the Title's two-region layout.
- [`recipes/buttons-and-clickables.md`](buttons-and-clickables.md) — when to use `Link` vs. `Button` for the action.
