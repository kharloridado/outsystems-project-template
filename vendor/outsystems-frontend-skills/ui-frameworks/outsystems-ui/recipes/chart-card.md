---
name: osui-recipe-chart-card
description: How to build an analytical card with a CardSectioned wrapper, a donut/area/column chart from OutSystemsCharts, ChartLegend + ChartSeriesStyling addons, custom Highcharts config via ExecuteClientAction, and a multi-source aggregate with joins. Use when the request mentions a "spending overview / breakdown chart", "donut by category", "chart with legend", "View Full Report link", or any analytical card needing both styling control and joined data.
---

# Recipe — Chart Card (Analytics Tile)

> **Goal:** the most general analytics-card pattern — a `CardSectioned` with a fully-customized chart in the body, a styled title row, and a footer link to a detail view. Backed by a multi-source aggregate with joins and a custom Highcharts config.

> **When to use:** "spending overview", "expenses by category", "revenue by region", "donut chart of plan distribution" — any analytical card where the data needs joining, the chart needs a legend, and the visual needs to match a specific palette / labels.

This is the upgrade path from [`sparkline-card.md`](sparkline-card.md) when you need: addons (legend, styling), Highcharts customization beyond what the block exposes, joined sources, or a footer action.

## Trigger phrases

- "Donut chart by category / pie chart of types"
- "Breakdown chart" / "spending overview"
- "Chart with legend on the right / vertical legend"
- "Custom colors / custom Highcharts config / brand-color chart"
- "View Full Report" / "View details" link in a card footer
- "Revenue by region", "Expenses by category", "Sessions by source"

## What it produces

- `CardSectioned` (Title / Content / Footer placeholders).
- **Title**: `Columns2` — bold label on the left, dynamic period expression on the right (`FormatDateTime(CurrDate(), "MMMM yyyy")` → "May 2026").
- **Content**: `DonutChart` from `OutSystemsCharts/Charts`, bound to a multi-source aggregate, with `ChartLegend` (vertical, right) and `ChartSeriesStyling` addons in `AddOns_Placeholder`.
- **Footer**: `Separator` + right-aligned `Link` "View Full Report →" wired to a screen action.

Plus the data plumbing:
- An aggregate with **two LEFT joins** (Transaction → Accounts, Transaction → TransactionType static entity) and **two GroupBy** attributes.
- A `LocalVariable` totaled by an `OnAfterFetch` action.
- A `ChartInitialized` action that calls `OutSystemsCharts.SetHighchartsChartConfigs` to override Highcharts legend colors.

## Skeleton tree

```
Block "CardWithChart"
├── ScreenAggregate "GetThisMonthSpentByType"
│   ├── Sources: Sample_Transaction, Sample_Accounts, Sample_TransactionType
│   ├── Joins: Transaction LEFT Accounts on SourceAccount=Id; Transaction LEFT TransactionType on Type=Id
│   ├── GroupBy "Type"   → Sample_TransactionType.Label
│   ├── GroupBy "TypeId" → Sample_TransactionType.Id
│   └── Aggregated "AmountSum" (Sum of Sample_Transaction.Amount)
├── LocalVariable "TotalThisMonthCounter" : Integer
├── ScreenAction "ChartInitialized" (input: ChartWidgetId)
│   └── ExecuteClientAction → OutSystemsCharts.SetHighchartsChartConfigs (legend color overrides)
├── ScreenAction "GetThisMonthSpentByTypeOnAfterFetch"
│   └── ForEach over .List → Assign TotalThisMonthCounter += .Current.AmountSum
├── ScreenAction "OnSeeAllTransactions" (empty stub)
└── Widgets
    └── CardSectioned
        ├── Title placeholder
        │   └── Columns2 (defaults)
        │       ├── Column1 → TextWidget "Spending Overview" (font-size-base)
        │       └── Column2 → Container (text-align: right)
        │                     └── Expression FormatDateTime(CurrDate(),"MMMM yyyy")
        ├── Content placeholder
        │   └── DonutChart "Chart" (from OutSystemsCharts/Charts)
        │       ├── DataPointList = TypeConversion of GetThisMonthSpentByType.List
        │       │     ↳ Value=AmountSum, Label=Type
        │       ├── Height = 200
        │       ├── EventHandler "Initialized" → ChartInitialized(ChartWidgetId)
        │       └── AddOns_Placeholder (clear default)
        │           ├── ChartLegend (Layout=Vertical, Position=Right, Styling.ItemsDistance=100)
        │           └── ChartSeriesStyling (default — placeholder for future customization)
        └── Footer placeholder
            ├── Separator
            └── Container (text-align: right)
                └── Link "View Full Report →" → OnSeeAllTransactions
```

## Building it (Model API)

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var dashboards = app.MobileFlows.Named("DashboardsAndAnalytics");

    var outSystemsUI = app.References.Named("OutSystemsUI");
    var outSystemsCharts = app.References.Named("OutSystemsCharts");
    var sampleData = app.References.Named("OutSystemsSampleData");

    var content = outSystemsUI.MobileFlows.Named("Content");
    var adaptive = outSystemsUI.MobileFlows.Named("Adaptive");
    var utilities = outSystemsUI.MobileFlows.Named("Utilities");
    var charts = outSystemsCharts.MobileFlows.Named("Charts");
    var addons = outSystemsCharts.MobileFlows.Named("Addons");

    var block = dashboards.CreateBlock("CardWithChart");

    // 1) Multi-source aggregate with joins.
    var agg = block.CreateScreenAggregate(false, "GetThisMonthSpentByType");
    agg.SetMaxRecords("999");

    var txEntity = sampleData.Entities.OfType<OutSystems.Model.Data.IServerEntitySignature>().Named("Sample_Transaction");
    var acctEntity = sampleData.Entities.OfType<OutSystems.Model.Data.IServerEntitySignature>().Named("Sample_Accounts");
    var typeEntity = sampleData.Entities.OfType<OutSystems.Model.Data.IStaticEntitySignature>().Named("Sample_TransactionType");

    var txSrc = agg.AsDatabaseAggregate.CreateSource(txEntity);
    var acctSrc = agg.AsDatabaseAggregate.CreateSource(acctEntity);
    var typeSrc = agg.AsDatabaseAggregate.CreateSource(typeEntity);

    // LEFT join Transaction → Accounts
    var join1 = agg.AsDatabaseAggregate.CreateJoin();
    join1.LeftSource = txSrc;
    join1.RightSource = acctSrc;
    join1.JoinType = OutSystems.Model.Enumerations.JoinType.Left;
    join1.SetCondition("Sample_Transaction.SourceAccount = Sample_Accounts.Id");

    // LEFT join Transaction → TransactionType (static entity)
    var join2 = agg.AsDatabaseAggregate.CreateJoin();
    join2.LeftSource = txSrc;
    join2.RightSource = typeSrc;
    join2.JoinType = OutSystems.Model.Enumerations.JoinType.Left;
    join2.SetCondition("Sample_Transaction.Type = Sample_TransactionType.Id");

    agg.AsDatabaseAggregate.CreateGroupByAttribute("Type").SetAttribute("Sample_TransactionType.Label");
    agg.AsDatabaseAggregate.CreateGroupByAttribute("TypeId").SetAttribute("Sample_TransactionType.Id");

    var amountSum = agg.AsDatabaseAggregate.CreateAggregatedAttribute("AmountSum");
    amountSum.SetAttribute("Sample_Transaction.Amount");
    amountSum.AggregationType = AggregationType.Sum;

    // 2) Local variable for the running total.
    var total = block.CreateLocalVariable("TotalThisMonthCounter");
    total.DataType = app.IntegerType;

    // 3) ChartInitialized action — overrides Highcharts legend colors via SetHighchartsChartConfigs.
    var chartInitialized = block.CreateScreenAction("ChartInitialized");
    var widgetIdInput = chartInitialized.CreateInputParameter("ChartWidgetId");
    widgetIdInput.DataType = app.TextType;
    widgetIdInput.IsMandatory = true;

    var ciStart = chartInitialized.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();

    var setConfigs = chartInitialized.CreateNode<OutSystems.Model.Logic.Nodes.IExecuteClientActionNode>("SetHighchartsChartConfigs");
    var setConfigsAction = outSystemsCharts.ClientActions.Named("SetHighchartsChartConfigs");
    setConfigs.Action = setConfigsAction;
    ciStart.Target = setConfigs;

    // PropertyValueList is a list of records, each with a path-array and a value.
    // This overrides legend.itemStyle.color and legend.itemHoverStyle.color to theme tokens.
    setConfigs.SetArgumentValue(
        setConfigsAction.InputParameters.Named("PropertyValueList"),
        new ExpressionDefinition.ListLiteral([
            new ExpressionDefinition.RecordLiteral(fields: [
                ("PropertyPathList", new ExpressionDefinition.ListLiteral([
                    "\"legend\"", "\"itemStyle\"", "\"color\"" ])),
                ("Value", "\"var(--color-neutral-7)\""),
            ]),
            new ExpressionDefinition.RecordLiteral(fields: [
                ("PropertyPathList", new ExpressionDefinition.ListLiteral([
                    "\"legend\"", "\"itemHoverStyle\"", "\"color\"" ])),
                ("Value", "\"var(--color-neutral-10)\""),
            ]),
        ]));
    setConfigs.SetArgumentValue(
        setConfigsAction.InputParameters.Named("WidgetId"),
        "ChartWidgetId");

    var ciEnd = chartInitialized.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>();
    setConfigs.Target = ciEnd;

    // 4) OnAfterFetch: total the AmountSum across rows.
    var onAfterFetch = block.CreateScreenAction("GetThisMonthSpentByTypeOnAfterFetch");
    var afStart = onAfterFetch.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();

    var forEach = onAfterFetch.CreateNode<OutSystems.Model.Logic.Nodes.IForEachNode>();
    forEach.Label = "TotalSpent";
    forEach.SetRecordList("GetThisMonthSpentByType.List");
    afStart.Target = forEach;

    var assign = onAfterFetch.CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>().ToTheRightOf(forEach, 2057);
    assign.Target = forEach;
    assign.CreateAssignment(
        "TotalThisMonthCounter",
        "TotalThisMonthCounter + GetThisMonthSpentByType.List.Current.AmountSum");
    forEach.CycleTarget = assign;

    var afEnd = onAfterFetch.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>();
    forEach.Target = afEnd;

    // 5) Footer link target action (empty stub for now).
    var onSeeAll = block.CreateScreenAction("OnSeeAllTransactions");
    var saStart = onSeeAll.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
    var saEnd = onSeeAll.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(saStart, 1500);

    // 6) Outer CardSectioned.
    var cardSectionedSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("CardSectioned");
    var card = block.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    card.SourceBlock = cardSectionedSig;

    // 7) Title placeholder: Columns2 with label + period expression.
    var titlePh = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Title");
    var columns2Sig = adaptive.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Columns2");
    var cols = titlePh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    cols.SourceBlock = columns2Sig;

    var col1 = cols.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Column1");
    var titleText = col1.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    titleText.SetStyleClasses("\"font-size-base\"");
    titleText.Text = "Spending Overview";

    var col2 = cols.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Column2");
    var periodWrap = col2.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    periodWrap.CustomStyle = "text-align: right;";

    // Expression widget — dynamic value via SetValue(), with a static `Example` for design-time preview.
    var period = periodWrap.CreateWidget<ServiceStudio.Plugin.NRWidgets.IExpression>();
    period.Example = "$123.00 spent";
    period.SetStyle("\"font-size-s text-neutral-7 font-regular\"");
    period.SetValue("FormatDateTime(CurrDate(), \"MMMM yyyy\")");

    // 8) Content placeholder: DonutChart with addons.
    var contentPh = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");
    var donutSig = charts.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("DonutChart");
    var chart = contentPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>("Chart");
    chart.SourceBlock = donutSig;

    // Clear default AddOns_Placeholder content before adding addon blocks.
    var addOnsPh = chart.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "AddOns_Placeholder");
    addOnsPh.Widgets.ToList().ForEach(w => w.Delete());

    chart.SetArgumentValue(
        donutSig.InputParameters.Named("DataPointList"),
        new ExpressionDefinition.TypeConversion(
            "GetThisMonthSpentByType.List",
            [("Value", "AmountSum"), ("Label", "Type"),
             ("SeriesName", null), ("Color", null), ("Tooltip", null)]));
    chart.SetArgumentValue(donutSig.InputParameters.Named("Height"), "200");

    // Wire the Initialized event to ChartInitialized — pass the chart's ID via "Chart.Id" expression.
    var initializedHandler = chart.EventHandlers.FirstOrDefault(e => e.Event.Name == "Initialized");
    initializedHandler.Handler = chartInitialized;
    initializedHandler.SetArgumentValue(widgetIdInput, "Chart.Id");

    // 9a) ChartLegend addon — vertical, right-side.
    var legendSig = addons.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("ChartLegend");
    var legend = addOnsPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    legend.SourceBlock = legendSig;
    legend.SetArgumentValue(legendSig.InputParameters.Named("Layout"), "Entities.LegendLayout.Vertical");
    legend.SetArgumentValue(legendSig.InputParameters.Named("Position"), "Entities.LegendPosition.Right");
    legend.SetArgumentValue(
        legendSig.InputParameters.Named("Styling"),
        new ExpressionDefinition.RecordLiteral(fields: [
            ("BackgroundColor", null),
            ("ItemsDistance", "100"),
        ]));

    // 9b) ChartSeriesStyling addon (defaults — useful as a placeholder for future customization).
    var seriesStylingSig = addons.Nodes
        .OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>()
        .Named("ChartSeriesStyling");
    var seriesStyling = addOnsPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    seriesStyling.SourceBlock = seriesStylingSig;
    seriesStyling.SetArgumentValue(
        seriesStylingSig.InputParameters.Named("Marker"),
        new ExpressionDefinition.RecordLiteral(fields: [
            ("HideMarker", null), ("FillColor", null), ("BorderColor", null),
            ("BorderWidth", null), ("Radius", null), ("MarkerSymbol", null),
        ]));
    seriesStyling.SetArgumentValue(
        seriesStylingSig.InputParameters.Named("Styling"),
        new ExpressionDefinition.RecordLiteral(fields: [
            ("FillColor", null), ("LineColor", null),
            ("LineWidth", null), ("Opacity", null),
        ]));

    // 10) Footer placeholder: Separator + right-aligned Link.
    var footerPh = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Footer");
    var separatorSig = utilities.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Separator");
    var sep = footerPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    sep.SourceBlock = separatorSig;

    var linkWrap = footerPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    linkWrap.CustomStyle = "text-align: right;";

    var link = linkWrap.CreateWidget<ServiceStudio.Plugin.NRWidgets.ILink>();
    var linkText = (OutSystems.Model.UI.Mobile.Widgets.ITextWidget)link.Widgets.First();
    linkText.Text = "View Full Report →";
    link.OnClick.Destination = onSeeAll;
}
```

## When you don't have real data — mock with literal `DataPointList`

> ⚠️ **Do NOT remove the chart and replace with a custom CSS donut / placeholder div** when no real aggregate is available. The chart block accepts a literal `ListLiteral` of `RecordLiteral` for `DataPointList` — use that to mock data and keep the real chart on the screen. Removing the chart costs you all the theme/legend/animation/responsive behavior that the block provides for free, and produces visibly fake UI ("conic-gradient div pretending to be a chart").

**Canonical mock pattern** — instead of `TypeConversion(<aggregate>.List, …)`, pass a `ListLiteral` of `RecordLiteral`s with hard-coded values:

```csharp
chart.SetArgumentValue(
    donutSig.InputParameters.Named("DataPointList"),
    new ExpressionDefinition.ListLiteral([
        new ExpressionDefinition.RecordLiteral(fields: [
            ("Label",      "\"Food\""),
            ("Value",      "320"),
            ("SeriesName", null),
            ("Color",      "\"#6c5ce7\""),       // optional per-slice color
            ("Tooltip",    "\"Food and groceries\""),
        ]),
        new ExpressionDefinition.RecordLiteral(fields: [
            ("Label",      "\"Transport\""),
            ("Value",      "180"),
            ("SeriesName", null),
            ("Color",      "\"#22d3ee\""),
            ("Tooltip",    null),
        ]),
        new ExpressionDefinition.RecordLiteral(fields: [
            ("Label",      "\"Shopping\""),
            ("Value",      "240"),
            ("SeriesName", null),
            ("Color",      "\"#fb923c\""),
            ("Tooltip",    null),
        ]),
        new ExpressionDefinition.RecordLiteral(fields: [
            ("Label",      "\"Entertainment\""),
            ("Value",      "92"),
            ("SeriesName", null),
            ("Color",      "\"#34d399\""),
            ("Tooltip",    null),
        ]),
    ]));
```

Every `DataPoint` field is one of: `Label` (string for the slice / x-axis tick), `Value` (number), `SeriesName` (only needed for multi-series line/bar charts; null for single-series donuts/pies), `Color` (CSS color string, optional — falls back to chart palette), `Tooltip` (optional hover text).

The chart renders identically whether the data comes from a real aggregate or a literal mock. **Mock first, swap to a `TypeConversion` once a real aggregate exists** — never replace the chart with a CSS placeholder.

This same pattern applies to `LineChart`, `AreaChart`, `BarChart`, `ColumnChart`, `PieChart` — all read `DataPointList` with the same field shape.

## Decision points when specializing

| Decision | Default | Override when |
|---|---|---|
| **Chart block** | `DonutChart` (good for category breakdowns) | `LineChart`/`AreaChart` for time series, `ColumnChart`/`BarChart` for comparisons, `PieChart` if you don't want the donut hole. |
| **Legend Layout / Position** | `Vertical` / `Right` | `Horizontal` / `Bottom` for narrow cards; skip the legend entirely if categories are self-evident from labels on the chart. |
| **Legend `ItemsDistance`** | `"100"` (px between items vertically) | Lower for tight legends, higher when items have long labels. |
| **Highcharts overrides via `SetHighchartsChartConfigs`** | Used here to retheme legend colors | Add more overrides to the `PropertyValueList` for axis labels, plot bands, tooltip styling. Each entry is `RecordLiteral(("PropertyPathList", ListLiteral([…path…])), ("Value", <expr>))`. |
| **Aggregate joins** | LEFT joins from a fact table to dimension tables | Use `Inner` when you only want rows that match across ALL sources; `Right` is rare. |
| **Static entity in joins** | Joining `Sample_Transaction.Type → Sample_TransactionType.Id` is the canonical "decode the Type code into a Label" pattern | Replace with the relevant static entity for your domain (`OrderStatus`, `Priority`, `Category`). |
| **Period expression** | `FormatDateTime(CurrDate(), "MMMM yyyy")` → "May 2026" | Use `"yyyy-MM"` for sortable; localize via the screen's `Locale` server action if i18n matters. |
| **Footer link** | "View Full Report" → empty stub action | Wire the action to `NavigateTo(<DetailScreen>)` once the detail screen exists. |

## Common pitfalls

❌ **Forgetting to clear `AddOns_Placeholder` before adding addon blocks.** Same trap as in [`sparkline-card.md`](sparkline-card.md). Default content stacks on top of the addons you add.

❌ **Building a `Container` of `<div>`s with chart-like CSS instead of using a real chart block.** OutSystemsCharts gives you accessibility, theme-awareness, responsive sizing, and Highcharts under the hood. A custom div mockup loses all of it.

❌ **Passing a string instead of `ExpressionDefinition.ListLiteral` to `SetHighchartsChartConfigs.PropertyValueList`.** The argument is strongly-typed as a list of records — a raw string fails the type check. The shape MUST be `ListLiteral` of `RecordLiteral` with a `PropertyPathList` (itself a `ListLiteral` of strings) and a `Value`.

❌ **Hardcoding hex colors in the Highcharts override** (`"#666666"` instead of `"\"var(--color-neutral-7)\""`). The CSS-variable form respects the active theme; hex breaks dark mode and theme variants.

❌ **Wiring the chart's `Initialized` handler before `ChartInitialized` exists.** Build order: declare action → declare its input parameters → only then `eventHandler.Handler = action`. The `SetArgumentValue(widgetIdInput, "Chart.Id")` step also requires `widgetIdInput` to already exist.

❌ **Treating the `Initialized` event handler as optional when using `SetHighchartsChartConfigs`.** That client action MUST be called from `Initialized` — calling it elsewhere races against Highcharts' own init.

❌ **Putting the Footer link directly in the placeholder without a `text-align: right` wrapper.** The `Footer` placeholder doesn't have a default text-alignment — wrap the link in a Container with `CustomStyle = "text-align: right;"` for consistent right-alignment.

❌ **Calling `block.CreateScreenAggregate(true, …)`.** The `false` first argument is "isAdvanced=false" → regular aggregate. Passing `true` gives you the advanced (SQL-defined) aggregate, which has a different builder API. For ~95% of cases, `false`.

❌ **Removing the chart block and replacing with a `Container` styled as a fake donut** (`background: conic-gradient(...)`) when no real aggregate exists. This is the most expensive regression — you lose theme awareness, legend, animation, accessibility, responsive sizing, and Highcharts customization. Mock `DataPointList` with a literal `ListLiteral` of `RecordLiteral`s (see "When you don't have real data" above) and keep the real chart. Swap to `TypeConversion` later when a real aggregate exists.

❌ **Falling back to "I don't have data" reasoning to skip the chart entirely.** The prompt asked for a chart — deliver a chart. Mock data is always better than no chart.

## Related

- [`recipes/sparkline-card.md`](sparkline-card.md) — simpler chart-card without the legend / Highcharts overrides / joined data.
- [`recipes/progress-card.md`](progress-card.md) — sibling pattern for non-chart progress visualizations.
- [`patterns/numbers.md`](../patterns/numbers.md) — non-chart numeric blocks.
- [`../../ui-components/outsystems-charts/README.md`](../../../ui-components/outsystems-charts/README.md) — chart library overview, addon catalog, event reference.
