---
name: osui-recipe-columns-and-cards-dashboard
description: How to compose a multi-row dashboard screen by stacking Columns* blocks, each filled with parameterized card blocks. Covers the canonical 4-up category row + 3-up KPI row + 2-up chart row pattern, per-row PhoneBehavior tuning, vertical spacing via margin-top-base, and reusing one parameterized block (e.g. CategoriesCard) across multiple instances with different Color args. Use when the request mentions "dashboard", "metric cards across the top", "stacked rows of cards", "categories + KPIs + charts layout", "responsive dashboard grid".
---

# Recipe — Columns + Cards Dashboard

> **Goal:** the canonical OutSystems UI dashboard screen — a vertical stack of `Columns*` rows, each row filled with `Card` family blocks per the per-card recipes (KPI tiles, charts, progress, sparklines). One screen, three to five rows, all theme-correct and responsive.

> **When to use:** any analytics / overview / dashboard screen where the request describes multiple horizontal rows of metric or chart cards. This is the screen-level pattern — the per-card recipes ([`kpi-card-with-trend.md`](kpi-card-with-trend.md), [`chart-card.md`](chart-card.md), [`progress-card.md`](progress-card.md), [`sparkline-card.md`](sparkline-card.md)) are the blocks you instantiate.

## Trigger phrases

- "Dashboard with 4 small category cards + 3 KPIs + 2 charts"
- "Stacked rows of cards / metric cards across the top, charts below"
- "Responsive analytics layout / overview screen"
- "Top row of category tiles, then a row of KPIs, then a chart row"
- Any "executive dashboard", "analytics overview", "spending overview screen"

## What it produces

A screen wrapped in `LayoutTopMenu` (or `LayoutSideMenu`) whose `MainContent` placeholder holds **a sequence of sibling `Columns*` block instances**, each containing parameterized card blocks. Vertical spacing between rows comes from `margin-top-base` on each `Columns*` after the first.

## Skeleton tree

```
Screen "Dashboard"
└── LayoutTopMenu
    ├── Header placeholder
    │   └── Menu block (from app's Common flow)
    ├── Title placeholder
    │   └── AdvancedHtml Tag="h1" "Cards"
    └── MainContent placeholder
        ├── Columns4 (PhoneBehavior=Middle)                               ← top row
        │   ├── Column1 → CategoriesCard (Color default → Red)
        │   ├── Column2 → CategoriesCard (Color=Green)
        │   ├── Column3 → CategoriesCard (Color=Yellow)
        │   └── Column4 → CategoriesCard (Color=Blue)
        ├── Columns3 (PhoneBehavior=First, ExtendedClass="margin-top-base") ← middle row
        │   ├── Column1 → KPICard
        │   ├── Column2 → KPICard
        │   └── Column3 → KPICard
        └── Columns2 (PhoneBehavior=All, ExtendedClass="margin-top-base")   ← bottom row
            ├── Column1 → CardWithChart
            └── Column2 → ProgressCard
                          └── Container "margin-top-base" wrapping a SparklineCard
                              (when one column needs two stacked cards)
```

Three guiding decisions visible in the skeleton:
1. **Column count per row** matches the visual density: tightly-packed category tiles → 4-up, KPIs → 3-up, large chart cards → 2-up.
2. **`PhoneBehavior` per row** tunes how the row collapses on mobile: `Middle` (4 → 2×2), `First` (largest cell breaks first), `All` (full stack). See decision table below.
3. **Vertical spacing**: every `Columns*` after the first gets `ExtendedClass="margin-top-base"` (or `margin-top-m`/`margin-top-xl` for more breathing room).

## Building it (Model API)

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var mainFlow = app.MobileFlows.Named("MainFlow");
    var layouts = app.MobileFlows.Named("Layouts");
    var common = app.MobileFlows.Named("Common");
    var dashboards = app.MobileFlows.Named("DashboardsAndAnalytics");  // or wherever your card blocks live

    var outSystemsUI = app.References.Named("OutSystemsUI");
    var adaptive = outSystemsUI.MobileFlows.Named("Adaptive");

    var columns4Sig = adaptive.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Columns4");
    var columns3Sig = adaptive.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Columns3");
    var columns2Sig = adaptive.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Columns2");

    // The reusable card blocks declared in the app's domain flow.
    var categoriesCardBlock = dashboards.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlock>().Named("CategoriesCard");
    var kpiCardBlock = dashboards.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlock>().Named("KPICard");
    var cardWithChartBlock = dashboards.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlock>().Named("CardWithChart");
    var progressCardBlock = dashboards.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlock>().Named("ProgressCard");
    var sparklineCardBlock = dashboards.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlock>().Named("SparklineCard");

    // 1) Screen scaffold + LayoutTopMenu (see layouts.md / sidebar-navigation.md for full layout setup).
    var screen = mainFlow.CreateScreen("Dashboard");
    screen.Widgets.ToList().ForEach(w => w.Delete());
    // ... wrap in LayoutTopMenu, fill Header with Menu, fill Title with AdvancedHtml h1, etc.
    var layoutInstance = screen.Widgets.OfType<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>().First();
    var mainPh = layoutInstance.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "MainContent");

    // 2) Top row — Columns4 of CategoriesCard, one per Color.
    var top = mainPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    top.SourceBlock = columns4Sig;
    top.SetArgumentValue(columns4Sig.InputParameters.Named("PhoneBehavior"), "Entities.BreakColumns.Middle");
    // GutterSize / TabletBehavior left at defaults.
    // No margin-top on the FIRST row — it sits flush at the top of MainContent.

    var colorCycle = new[] { (string?)null, "Entities.Color.Green", "Entities.Color.Yellow", "Entities.Color.Blue" };
    var content = new[] { ("shopping-cart-simple", "Monthly Spending", "€1,243.80", "↑ 8% vs last month") };  // same content for every tile in this demo
    for (int i = 0; i < 4; i++) {
        var ph = top.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == $"Column{i+1}");
        var card = ph.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
        card.SourceBlock = categoriesCardBlock;
        if (colorCycle[i] != null) {
            card.SetArgumentValue(categoriesCardBlock.InputParameters.Named("Color"), colorCycle[i]);
        }
        // Fill the four named placeholders on CategoriesCard (Icon / Category / Value / Goal)
        // — instantiate the placeholder content via card.PlaceholdersContent.
    }

    // 3) Middle row — Columns3 of KPICard. PhoneBehavior=First, vertical spacing via margin-top-base.
    var middle = mainPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    middle.SourceBlock = columns3Sig;
    middle.SetArgumentValue(columns3Sig.InputParameters.Named("PhoneBehavior"), "Entities.BreakColumns.First");
    middle.SetArgumentValue(columns3Sig.InputParameters.Named("ExtendedClass"), "\"margin-top-base\"");

    for (int i = 0; i < 3; i++) {
        var ph = middle.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == $"Column{i+1}");
        var card = ph.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
        card.SourceBlock = kpiCardBlock;
    }

    // 4) Bottom row — Columns2. PhoneBehavior=All. Column1 = CardWithChart; Column2 = ProgressCard + (sibling, margin-top-base) SparklineCard.
    var bottom = mainPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    bottom.SourceBlock = columns2Sig;
    bottom.SetArgumentValue(columns2Sig.InputParameters.Named("PhoneBehavior"), "Entities.BreakColumns.All");
    bottom.SetArgumentValue(columns2Sig.InputParameters.Named("ExtendedClass"), "\"margin-top-base\"");

    var col1 = bottom.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Column1");
    var chartCard = col1.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    chartCard.SourceBlock = cardWithChartBlock;

    var col2 = bottom.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Column2");
    var progressCard = col2.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    progressCard.SourceBlock = progressCardBlock;

    // Stack a second card beneath the ProgressCard inside the same column.
    var sparklineWrap = col2.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    sparklineWrap.SetStyle("\"margin-top-base\"");
    var sparklineCard = sparklineWrap.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    sparklineCard.SourceBlock = sparklineCardBlock;
}
```

## Decision points

### Picking the column count per row

| Card content | Column count | Notes |
|---|---|---|
| Tight category / status tiles (icon + label + small value) | `Columns4` (or `Columns5`/`Columns6` if many) | The cards are small enough that 4 fit comfortably on desktop. |
| Standard KPI tiles (label + big number + trend pill) | `Columns3` | KPIs need horizontal room for the big number; 3-up is the sweet spot. |
| Large chart / progress / detail cards | `Columns2` | Each card has substantial content; 2-up keeps each readable. |
| Single hero card (full-width chart, full-width detail panel) | No `Columns*` — drop the card directly into `MainContent` | Saves a wrapping block. Add `margin-top-base` directly on the card's wrapper if needed for spacing. |

For asymmetric splits (60/40, 40/60, 33/67, 67/33) use `ColumnsMediumLeft` / `ColumnsMediumRight` / `ColumnsSmallLeft` / `ColumnsSmallRight` — see [`patterns/adaptive.md`](../patterns/adaptive.md).

### Picking `PhoneBehavior` per row

| `PhoneBehavior` | Effect on phone | Use for |
|---|---|---|
| `BreakColumns.None` | Keep side-by-side (rare; can break readability) | When all cells are tiny (icons, short text). |
| `BreakColumns.Middle` | Split into two halves vertically (4-up → 2×2 grid) | Tight tile rows where pairing makes sense. |
| `BreakColumns.First` | First cell breaks to full width, rest stay together | A "hero + secondary" layout where the first column is the most important. |
| `BreakColumns.All` | Full vertical stack | The default for chart/large-card rows. Always safe. |

`TabletBehavior` follows the same enum and defaults to keeping the row intact unless you set it explicitly.

### Vertical spacing between rows

Always set `ExtendedClass="margin-top-base"` (or larger — `margin-top-m`, `margin-top-xl`) on **every `Columns*` block instance after the first**. The first row sits flush at the top of `MainContent`; subsequent rows need the explicit gap because the layout doesn't auto-space sibling block instances.

For tighter spacing use `margin-top-s` / `margin-top-xs`. For section breaks (e.g. above a "Recent Activity" group of rows) use `margin-top-xl`.

### Stacking two cards in one column

When one column needs to host more than one card, wrap the second card in a `Container` with `margin-top-base` (as shown in step 4 of the C# template). Don't use a nested `Columns1` (it doesn't exist) and don't add `margin-top-base` on the card block instance directly — the wrapper Container is the right place.

## Common pitfalls

❌ **Wrapping the column rows in another `Container`** instead of dropping them as direct siblings of `MainContent`. The Container's default `(fill parent)` width adds nothing and breaks the implicit `Columns*` margin handling. Drop them flat into `MainContent`.

❌ **Using `Columns2` (or any other) without setting `PhoneBehavior`.** The default keeps cells side-by-side on phone, which usually fails for any card-shaped content. Always set `PhoneBehavior` explicitly.

❌ **Putting `margin-top-base` on the FIRST row.** The first row sits at the top of `MainContent`; adding margin-top there creates dead space. Set it only on rows 2…N.

❌ **Hand-rolling the row spacing with custom `<style>` or inline CSS** — `padding-top: 24px` on the row's first child, `margin-top: 16px` in the screen StyleSheet, etc. Use the OS UI utility class `margin-top-{xs|s|base|m|l|xl|xxl}`. Wins: theme-aware spacing scale, predictable across breakpoints, no StyleSheet bloat.

❌ **Mixing custom `Container`s with column-rows.** If you need to stack two cards in one column, wrap them in a `Container`. If you need to lay them out side-by-side, use a nested `Columns2`. Don't mix custom flex CSS with `Columns*` — pick one model.

❌ **Reaching for `Columns5` / `Columns6` when 4 fits.** OS UI offers them but they cram cells too tight on most viewports. Only use 5/6 for very narrow content (icon-only chips, small numeric labels). For card-shaped content, 4 is the practical max.

## Related

- [`recipes/kpi-card-with-trend.md`](kpi-card-with-trend.md), [`progress-card.md`](progress-card.md), [`sparkline-card.md`](sparkline-card.md), [`chart-card.md`](chart-card.md) — the per-card recipes referenced from this dashboard.
- [`patterns/adaptive.md`](../patterns/adaptive.md) — `Columns*` arg reference and asymmetric variants.
- [`structural-skeleton.md`](../structural-skeleton.md) — the Step-B skeleton sketch that this dashboard pattern is the canonical answer for.
- [`layouts.md`](../layouts.md) — picking `LayoutTopMenu` vs. `LayoutSideMenu` for the dashboard's outer chrome.
