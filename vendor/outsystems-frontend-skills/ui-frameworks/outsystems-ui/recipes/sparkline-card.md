---
name: osui-recipe-sparkline-card
description: How to build a card with an inline sparkline / area chart powered by an aggregate over an entity (e.g. last 7 days of transactions). Covers screen aggregate creation with GroupBy + AggregatedAttribute, a local variable populated by a ForEach in OnAfterFetch, and an AreaChart from OutSystemsCharts wired via TypeConversion. Use when the request mentions "sparkline", "trend chart in a card", "last 7 days chart", "mini chart with KPI", "area chart card".
---

# Recipe — Sparkline Card

> **Goal:** a card that pairs a headline number + trend pill with a small area chart underneath. The chart is bound to a screen aggregate that groups + sums values over time.

> **When to use:** any "stat with a trend chart" tile — daily transactions, weekly signups, monthly revenue, hourly traffic, etc. This recipe is the bridge from "pretty static KPI" to "actual data-driven dashboard tile" without leaving the safe block + aggregate path.

## Trigger phrases

- "Sparkline card / sparkline tile"
- "Mini chart inside a card"
- "Area chart with a KPI on top"
- "Last 7 days / last N days trend"
- "Card with chart-bar icon and arrow indicator"
- "Programs / Sales / Sessions trend over time"

## What it produces

A reusable `Card` block containing:
- **Header row**: big number + an inline trend (arrow + percent in green) + a chart-icon button.
- **Footer label**: "Programs →" (clickable).
- **Chart**: `AreaChart` from `OutSystemsCharts/Charts`, height ~410, bound via `TypeConversion` to an aggregate; `ChartSeriesStyling` addon configured.

Backed by:
- A `ScreenAggregate` over a server entity (e.g. `Sample_Transaction`), grouping by `Date`, summing `Balance`.
- A `LocalVariable` that totals the aggregate result.
- A `ScreenAction` `OnAfterFetch` containing a `ForEach` + `Assign` that walks the aggregate list and builds the total.

## Skeleton tree

```
Block "SparklineCard"
├── ScreenAggregate "GetLast7DaysTransactions"
│   ├── Source: OutSystemsSampleData.Sample_Transaction
│   ├── GroupByAttribute "Date" → Sample_Transaction.Date
│   └── AggregatedAttribute "BalanceSum" (Sum of Sample_Transaction.Balance)
├── LocalVariable "Last7DaysBalance" : LongInteger
├── ScreenAction "GetLineChartDataOnAfterFetch"
│   └── Start → ForEach(GetLast7DaysTransactions.List)
│                 ↳ cycle: Assign Last7DaysBalance = Last7DaysBalance + .Current.BalanceSum
│              → End
└── Widgets
    └── Card (from OutSystemsUI/Content)
        └── Content placeholder
            ├── Container "header row"
            │   ├── Container (3 col) — big number "48", trend "↗ 12.4%" in text-success
            │   └── Container (36×36, "card shadow-s padding-s …") — chart-bar icon button
            ├── Container "footer label" — "Programs" + arrow-right
            └── AreaChart "Chart" (from OutSystemsCharts/Charts)
                ├── DataPointList = TypeConversion of GetLast7DaysTransactions.List
                │     ↳ Value=BalanceSum, Label=Date
                ├── Height = 410
                └── AddOns_Placeholder (clear default, then add ChartSeriesStyling)
```

## Building it (Model API)

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var dashboards = app.MobileFlows.Named("DashboardsAndAnalytics");

    // References we need.
    var outSystemsUI = app.References.Named("OutSystemsUI");
    var outSystemsCharts = app.References.Named("OutSystemsCharts");
    var sampleData = app.References.Named("OutSystemsSampleData");

    var content = outSystemsUI.MobileFlows.Named("Content");
    var charts = outSystemsCharts.MobileFlows.Named("Charts");
    var addons = outSystemsCharts.MobileFlows.Named("Addons");

    // 1) The block.
    var block = dashboards.CreateBlock("SparklineCard");

    // 2) Aggregate. Note `false` (first arg of CreateScreenAggregate) means "regular" — not advanced.
    var agg = block.CreateScreenAggregate(false, "GetLast7DaysTransactions");
    agg.SetMaxRecords("999");
    agg.Fetch = OutSystems.Model.Enumerations.DataSourceFetch.AtStart;

    var txEntity = sampleData.Entities
        .OfType<OutSystems.Model.Data.IServerEntitySignature>()
        .Named("Sample_Transaction");
    agg.AsDatabaseAggregate.CreateSource(txEntity);

    // GroupBy: name the grouping attribute, then point it at the source attribute.
    agg.AsDatabaseAggregate
        .CreateGroupByAttribute("Date")
        .SetAttribute("Sample_Transaction.Date");

    // Aggregated attribute: name it, set the source attribute, set the AggregationType.
    var balanceSum = agg.AsDatabaseAggregate.CreateAggregatedAttribute("BalanceSum");
    balanceSum.SetAttribute("Sample_Transaction.Balance");
    balanceSum.AggregationType = AggregationType.Sum;

    // 3) Local variable (typed via the eSpace's primitive type accessor).
    var last7DaysBalance = block.CreateLocalVariable("Last7DaysBalance");
    last7DaysBalance.DataType = app.LongIntegerType;

    // 4) OnAfterFetch screen action: ForEach + Assign loop.
    var onAfterFetch = block.CreateScreenAction("GetLineChartDataOnAfterFetch");

    var startNode = onAfterFetch.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
    var forEach = onAfterFetch.CreateNode<OutSystems.Model.Logic.Nodes.IForEachNode>();
    forEach.SetRecordList("GetLast7DaysTransactions.List");
    startNode.Target = forEach;

    var assignNode = onAfterFetch
        .CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>()
        .ToTheRightOf(forEach, 2286);
    assignNode.Target = forEach;
    assignNode.CreateAssignment(
        "Last7DaysBalance",
        "Last7DaysBalance + GetLast7DaysTransactions.List.Current.BalanceSum");
    forEach.CycleTarget = assignNode;

    var endNode = onAfterFetch.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>();
    forEach.Target = endNode;

    // 5) Outer Card.
    var cardSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Card");
    var card = block.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    card.SourceBlock = cardSig;
    var cardCp = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");

    // 6) Header row: number + trend on the left, chart-icon button on the right.
    var headerRow = cardCp.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    headerRow.SetStyle("\"display-flex align-items-center justify-content-space-between\"");

    var leftBlock = headerRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    leftBlock.SetStyle("\"display-flex  align-items-center column-gap-s\"");
    leftBlock.Width = "3 col";

    var bigNumber = leftBlock.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    bigNumber.SetStyleClasses("\"font-size-display font-bold\"");
    bigNumber.Text = "48";   // bind to Last7DaysBalance via expression once data is real

    var trendInline = leftBlock.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    trendInline.SetStyle("\"text-success\"");

    var trendIcon = trendInline.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
    trendIcon.Icon = "arrow-up-right";
    trendIcon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
    trendIcon.Weight = "regular";

    var trendText = trendInline.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    trendText.SetStyleClasses("\"margin-left-xs\"");
    trendText.Text = "12.4%";

    var iconButton = headerRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    iconButton.CustomStyle = "height: 36px;";
    iconButton.Width = "36px";
    iconButton.SetStyle("\"card shadow-s padding-s display-flex align-items-center justify-content-center\"");

    var chartIcon = iconButton.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
    chartIcon.Icon = "chart-bar";
    chartIcon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
    chartIcon.Weight = "regular";

    // 7) Footer-style label row: "Programs →"
    var footerLabel = cardCp.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    footerLabel.SetStyle("\"text-neutral-7 display-flex align-items-center column-gap-s\"");

    var footerText = footerLabel.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    footerText.Text = "Programs";

    var footerArrow = footerLabel.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
    footerArrow.Icon = "arrow-right";
    footerArrow.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
    footerArrow.Weight = "light";

    // 8) AreaChart bound to the aggregate via TypeConversion.
    var areaChartSig = charts.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("AreaChart");
    var chart = cardCp.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>("Chart");
    chart.SourceBlock = areaChartSig;

    // CRITICAL: clear AddOns_Placeholder default content before adding addon blocks.
    var addOnsPh = chart.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "AddOns_Placeholder");
    addOnsPh.Widgets.ToList().ForEach(w => w.Delete());

    // DataPointList: TypeConversion projects aggregate columns into the chart's expected shape.
    chart.SetArgumentValue(
        areaChartSig.InputParameters.Named("DataPointList"),
        new ExpressionDefinition.TypeConversion(
            "GetLast7DaysTransactions.List",
            [("Value", "BalanceSum"), ("Label", "Date"),
             ("SeriesName", null), ("Color", null), ("Tooltip", null)]));

    chart.SetArgumentValue(areaChartSig.InputParameters.Named("Height"), "410");
    // Spline / ValuesType / OptionalConfigs / StackingType / ExtendedClass left at defaults.

    // 9) ChartSeriesStyling addon — drop into AddOns_Placeholder.
    var seriesStylingSig = addons.Nodes
        .OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>()
        .Named("ChartSeriesStyling");
    var seriesStyling = addOnsPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    seriesStyling.SourceBlock = seriesStylingSig;
    // All ChartSeriesStyling args left at defaults (SeriesType / Styling / Marker / etc. all null).
}
```

## Decision points when specializing

| Decision | Default | Override when |
|---|---|---|
| **Chart block** | `AreaChart` (smooth fill under a line) | `LineChart` for crisp peaks; `ColumnChart` for discrete daily totals; `DonutChart` (see [`chart-card.md`](chart-card.md)) for breakdowns by category. |
| **Aggregate `Fetch`** | `AtStart` (loads when block initializes) | `Manual` if the block exposes a "Refresh" action and shouldn't load on mount. |
| **`AggregationType`** | `Sum` for amounts | `Count` for occurrence-based metrics, `Average` for ratings, `Max`/`Min` for ranges. |
| **`MaxRecords`** | `"999"` (effectively unlimited for sparklines) | `"7"` / `"30"` if you want to cap to a fixed window of points. |
| **`Height`** | `"410"` (matches a card-sized sparkline) | `"120"` for a denser sparkline, `"600"` for a hero chart that takes the whole card. |
| **`DataPointList` projection** | `("Value", "<sum>"), ("Label", "<groupBy>")`, others null | Set `("SeriesName", "<categoryAttr>")` when grouping by category to break the line into multiple series; set `("Color", "<colorAttr>")` to drive per-point colors from data. |
| **Local variable + ForEach total** | Track the aggregate's totalled value for displaying alongside the chart | Drop the loop entirely if you only need the chart and not a headline KPI. |

## Common pitfalls

❌ **Skipping the `AddOns_Placeholder` cleanup.** Chart blocks ship with default addon widgets — leave them in and your styling addon stacks on top of phantom defaults. Always:
```csharp
addOnsPh.Widgets.ToList().ForEach(w => w.Delete());
```
before adding `ChartSeriesStyling` / `ChartLegend` / etc.

❌ **Passing a list literal to `DataPointList` instead of a `TypeConversion`.** The chart expects a `DataPoint[]` shape. If your data lives in a different aggregate row shape, you MUST project via `TypeConversion(sourceListExpr, [(targetField, sourceField), …])`. Trying to pass `GetX.List` directly will fail validation.

❌ **Putting the `OnAfterFetch` action's `ForEach` cycle target on the End node.** The cycle should target the `Assign` (`forEach.CycleTarget = assignNode`); the `Assign.Target` should be back to the `ForEach`. The straight `forEach.Target = endNode` is the *exit* edge.

❌ **Using `app.IntegerType` for cumulative totals.** A 7-day transaction sum can easily exceed Integer range. Use `app.LongIntegerType` for monetary totals; `app.DecimalType` if values aren't already pre-rounded.

❌ **Naming the aggregate without an `OnAfterFetch` handler when you need post-processing.** The aggregate's data is available via `<AggregateName>.List` everywhere on the screen, but if you need a derived total or transformation, declare the screen action AND wire it as the aggregate's `OnAfterFetch` event handler (this recipe leaves that wiring out — see `eventHandler.Handler = onAfterFetch` in the chart-card recipe for the pattern).

❌ **Forgetting `Fetch = AtStart`.** It IS the default but writing it explicitly is good documentation when the recipe is meant to teach.

## Related

- [`recipes/chart-card.md`](chart-card.md) — extends this recipe with addons (ChartLegend, multiple addon configurations) and a more complex multi-source aggregate.
- [`recipes/kpi-card-with-trend.md`](kpi-card-with-trend.md) — the static-KPI version (no chart) — pair with this one in a dashboard row.
- [`patterns/numbers.md`](../patterns/numbers.md) — non-chart number visualizations (Counter, ProgressBar).
- [`../../ui-components/outsystems-charts/README.md`](../../../ui-components/outsystems-charts/README.md) — chart library overview.
