---
name: osui-recipe-kpi-card-with-trend
description: How to build a KPI / metric card showing a label + icon, a big number, and a trend pill (up/down %, comparison vs. previous period). Uses Card + Tag + Separator from OutSystemsUI. Use when the request mentions "KPI card", "metric card with trend", "stat tile with up/down indicator", "revenue card", "growth indicator", "vs last month / vs previous period".
---

# Recipe — KPI Card with Trend

> **Goal:** the canonical OutSystemsUI dashboard tile — a label with an icon, a prominent number, and a trend pill comparing against a previous period.

> **When to use:** dashboards, analytics screens, or any KPI strip showing 3–4 metrics side-by-side. Use this *inside* a `Columns3` / `Columns4` to lay out a row of KPIs.

## Trigger phrases

- "KPI card / KPI tile / metric card"
- "Total revenue / total sales / total users with up arrow"
- "Stat block with trend / growth indicator"
- "$X this month, +Y% vs previous"
- "Up/down arrow next to a percentage in a card"

## What it produces

A `Card` block (from `OutSystemsUI/Content`) laid out as:
- **Header row**: label text on the left, an `Icon` on the right.
- **Value row**: the big metric, styled with the display typography.
- **Trend row**: a `Tag` block (green/red, light, small, soft-rounded) showing an up/down arrow + percent, followed by a label like "vs last month".
- **Comparison row** (optional): a `Separator` and a faint comparison sentence ("from $43,020 in previous period").

## Skeleton tree

```
Card  (from OutSystemsUI/Content, ExtendedClass="row-gap-base display-flex flex-direction-column")
└── Content placeholder
    ├── Container "header row" (display-flex align-items-center justify-content-space-between, text-neutral-7)
    │   ├── TextWidget                        "Total Revenue"
    │   └── Icon (currency-dollar, regular)
    ├── Container "value row"
    │   └── TextWidget (font-size-display font-bold)         "$48,200"
    └── Container "trend row"
        ├── Container (inner row)
        │   ├── Tag (Color=Green, Shape=SoftRounded, IsLight=True, Size=Small)
        │   │   └── Tag placeholder
        │   │       ├── Icon (arrow-fat-up)
        │   │       └── TextWidget (margin-left-xs)          "12.4%"
        │   └── TextWidget (text-neutral-7 margin-left-s)    "vs last month"
        ├── Separator (from OutSystemsUI/Utilities, defaults)
        └── TextWidget (text-neutral-7)                       "from $43,020 in previous period"
```

## Building it (Model API)

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var outSystemsUI = app.References.Named("OutSystemsUI");
    var content = outSystemsUI.MobileFlows.Named("Content");
    var utilities = outSystemsUI.MobileFlows.Named("Utilities");

    var cardSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Card");
    var tagSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Tag");
    var separatorSig = utilities.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Separator");

    // 1) Outer Card.
    var card = parentPlaceholder.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    card.SourceBlock = cardSig;
    card.SetArgumentValue(cardSig.InputParameters.Named("ExtendedClass"),
        "\"row-gap-base display-flex flex-direction-column\"");

    var cardContent = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");

    // 2) Header row: label left, icon right.
    var headerRow = cardContent.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    headerRow.SetStyle("\"text-neutral-7 display-flex align-items-center justify-content-space-between\"");

    var label = headerRow.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    label.Text = "Total Revenue";

    var icon = headerRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
    icon.Icon = "currency-dollar";
    icon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
    icon.Weight = "regular";

    // 3) Big value.
    var valueRow = cardContent.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    var valueText = valueRow.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    valueText.SetStyleClasses("\"font-size-display font-bold\"");
    valueText.Text = "$48,200";

    // 4) Trend row: a Tag pill + comparison label, then a Separator + footer text.
    var trendRow = cardContent.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();

    var trendInner = trendRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();

    // 4a) The Tag block — Color/Shape/IsLight/Size driven via OS UI static entities.
    var tag = trendInner.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    tag.SourceBlock = tagSig;
    tag.SetArgumentValue(tagSig.InputParameters.Named("Color"), "Entities.Color.Green");
    tag.SetArgumentValue(tagSig.InputParameters.Named("Shape"), "Entities.Shape.SoftRounded");
    tag.SetArgumentValue(tagSig.InputParameters.Named("IsLight"), "True");
    tag.SetArgumentValue(tagSig.InputParameters.Named("Size"), "Entities.Size.Small");

    var tagPh = tag.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Tag");
    var tagIcon = tagPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
    tagIcon.Icon = "arrow-fat-up";   // "arrow-fat-down" + Color.Red for negative trends
    tagIcon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
    tagIcon.Weight = "regular";

    var tagText = tagPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    tagText.SetStyleClasses("\"margin-left-xs\"");
    tagText.Text = "12.4%";

    // 4b) Comparison label after the tag.
    var trendLabel = trendInner.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    trendLabel.SetStyleClasses("\"text-neutral-7 margin-left-s\"");
    trendLabel.Text = "vs last month";

    // 5) Separator (defaults — horizontal, base spacing) + previous-period sentence.
    var sep = trendRow.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    sep.SourceBlock = separatorSig;
    // Separator's args (Space / Color / IsVertical / ExtendedClass) all accept null → defaults.

    var prevSentence = trendRow.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    prevSentence.SetStyleClasses("\"text-neutral-7\"");
    prevSentence.Text = "from $43,020 in previous period";
}
```

## Decision points when specializing

| Decision | Default | Override when |
|---|---|---|
| **Trend direction** | Up: `Color.Green` + `arrow-fat-up` | Down: `Color.Red` + `arrow-fat-down`. Choose at composition time based on whether the metric increased or decreased. |
| **Tag `IsLight`** | `True` (subtle pill background) | `False` for high-emphasis; rare on dashboards (would compete with the main value). |
| **Tag `Size`** | `Small` | Don't go bigger — the trend is secondary information. |
| **Tag `Shape`** | `SoftRounded` | `Rounded` for a fully-pill shape; `Sharp` for a square chip (rare in OS UI defaults). |
| **Icon for label** | One Phosphor icon per metric (currency-dollar, users, shopping-cart, chart-line) | Pick by metric domain. Keep weight `regular`. |
| **Comparison sentence** | Optional Separator + one-line sentence | Drop both if the request only specifies the trend pill and not a previous-period comparison. |
| **Card `ExtendedClass`** | `"row-gap-base display-flex flex-direction-column"` | Add `"full-height"` when the card sits inside a `Columns*` cell and you want all KPIs the same height. |

## Wiring into a row

A KPI strip is almost always 3–4 of these inside `Columns3`/`Columns4`:

```csharp
var columns3Sig = outSystemsUI.MobileFlows.Named("Adaptive").Nodes
    .OfType<IMobileBlockSignature>().Named("Columns3");

var columns3 = mainContent.CreateWidget<IMobileBlockInstanceWidget>();
columns3.SourceBlock = columns3Sig;
columns3.SetArgumentValue(columns3Sig.InputParameters.Named("PhoneBehavior"), "Entities.BreakColumns.All");

foreach (var (col, label, value, trend) in new[] {
    ("Column1", "Total Revenue",  "$48,200", "+12.4%"),
    ("Column2", "Active Users",   "1,284",   "+3.2%"),
    ("Column3", "Conversion",     "3.8%",    "-0.4%"),
}) {
    var ph = columns3.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == col);
    // ... call the KPI card recipe inside `ph` with these values.
}
```

The `ExtendedClass="full-height"` on each Card keeps them visually aligned even when one wraps to two lines.

## Common pitfalls

❌ **Using a `Counter` block instead of a hand-built KPI card.** The `Counter` block (from `OutSystemsUI/Numbers`) is for inline metrics inside lists / forms — it doesn't have a trend area or a card surface. For a dashboard tile, build the Card-based shape from this recipe.

❌ **Hardcoding red/green colors via `text-success` / `text-danger` classes** instead of using `Tag` with `Color.Green` / `Color.Red`. The Tag block is theme-aware (light variant uses subtle background tints, respects dark mode). A raw class doesn't.

❌ **Missing the `Tag` placeholder name.** It's `"Tag"` (matching the block name), not `"Content"`. Always look up the actual placeholder name via `PlaceholdersContent` enumeration if unsure.

❌ **Forgetting the Tag's `IsLight` arg.** Default is unset → solid bold pill that overpowers the metric. For trend pills you almost always want `IsLight=True`.

❌ **Dropping the Separator.** Without it the comparison sentence runs visually into the trend row. Either keep the Separator or remove the comparison sentence entirely.

❌ **Putting full sentences in a `Tag`.** Tags are short labels — "12.4%", "+12%", "Up 4". A whole "vs last month" goes in a sibling `TextWidget`, not inside the Tag.

## Related

- [`patterns/numbers.md`](../patterns/numbers.md) — `Counter`, `ProgressBar`, `Tag` reference.
- [`patterns/adaptive.md`](../patterns/adaptive.md) — `Columns3`/`Columns4` for laying out a KPI row.
