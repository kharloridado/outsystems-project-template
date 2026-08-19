---
name: outsystems-charts
description: OutSystems Charts — column/bar/line/area/pie/donut/scatter chart blocks (Charts API v2). Use when adding charts to a screen, picking a chart type, building DataPoint lists with ConvertList, or doing advanced Highcharts JSON customization.
---

# OutSystems Charts

> **Asset:** OutSystems Charts (separate Forge component, not part of core OutSystems UI).
> **Showcase:** [charts.outsystems.com](https://charts.outsystems.com)
> **API reference (v2):** [Charts API v2 documentation](https://success.outsystems.com/documentation/11/reference/outsystems_apis/charts_api_v2/charts/)

## What it is

OutSystems Charts provides a set of chart Blocks (column, bar, line, area, pie, donut, scatter, …) backed by Highcharts under the hood. Drop a chart Block on a screen, pass it data, and the framework handles rendering, legends, tooltips, and responsiveness.

There are **two API versions**:

- **Charts API v2 (current)** — modern blocks with simpler inputs and design-token-aware defaults. Use this in new apps.
- **Charts API (legacy v1)** — older blocks; used by some templates. Don't introduce new usage.

## When to use which chart

| Need | Block (v2) |
|---|---|
| Compare values across categories | `ColumnChart` (vertical) or `BarChart` (horizontal) |
| Trend over time | `LineChart` |
| Cumulative trend / volume over time | `AreaChart` |
| Part-to-whole | `PieChart` (or `DonutChart` for a hole in the middle) |
| Correlation between two variables | `ScatterChart` |
| Hierarchical categorical data | `PackedBubbleChart`, `Treemap` (where available) |

When in doubt:

- **Few categories, one metric per category** → Column / Bar.
- **Time series** → Line / Area.
- **Composition adding to 100%** → Pie / Donut.

## Common shape

All v2 chart Blocks share a similar input contract:

| Input | Type | Purpose |
|---|---|---|
| `Title` | Text | Chart title (renders above the chart). |
| `SourceDataPointList` (or `SourceDataPointSeriesList`) | DataPoint List | The data. Build via `ConvertList(...)`. |
| `LegendPositionId` | `LegendPosition_v2` Identifier | `Top` · `Bottom` · `Left` · `Right` · `Hidden`. |
| `Height` | Integer | Chart height in pixels. |
| `XAxisTitle` / `YAxisTitle` | Text | Axis labels (where applicable). |
| `OptionalConfigs` | Record | Misc display flags — colors, animation, gridlines. |
| `AdvancedFormat` | Text (JSON) | Highcharts JSON for fine-grained customization not exposed by the block. |
| `ExtendedClass` | Text | Extra CSS classes. |

**Event** `OnDataPointClick` (most chart types) — payload describes the clicked data point.

## Building data

A `DataPoint` is a record like `{ Label: Text, Value: Decimal }` (single series) or `{ Label, SeriesName, Value }` (multi-series).

The standard way to build the list is `ConvertList` over an aggregate:

```
ConvertList(
  GetChartData.List,
  { Label: "Sample_RequestStatus.Label", Value: "Count" }
)
```

Use a `GroupByOperation` in the aggregate to pre-aggregate counts/sums before binding.

## Minimal example — DonutChart

```jsonc
{
  "Object": "UIBlockInstanceWidget",
  "SourceBlock": "DonutChart_v2",
  "Arguments": [
    { "Object": "Argument", "Parameter": "Title",
      "Value": "\"Requests by Department\"" },
    { "Object": "Argument", "Parameter": "Height", "Value": "410" },
    { "Object": "Argument", "Parameter": "LegendPositionId",
      "Value": "Entities.LegendPosition_v2.Bottom" },
    { "Object": "Argument", "Parameter": "SourceDataPointList",
      "Value": "ConvertList(GetChartData.List, { Label: \"Label\", Value: \"Count\" })" }
  ],
  "PlaceholdersContent": []
}
```

(This shape — `Title` / `Height` / `LegendPositionId` / `SourceDataPointList` — is the canonical pattern; specific blocks add their own extras.)

## Advanced customization (JSON)

For options not exposed as block inputs (custom tooltip formatters, complex axis configs, animations), pass a Highcharts JSON string via the `AdvancedFormat` input. The block merges your JSON over its defaults at render time. See [Advanced Charts customization with JSON](https://success.outsystems.com/documentation/11/reference/outsystems_apis/charts_api/advanced_charts_customization_with_json/).

```
AdvancedFormat = "{
  ""tooltip"": { ""shared"": true, ""crosshairs"": true },
  ""plotOptions"": { ""series"": { ""animation"": false } }
}"
```

Quote the JSON string and escape inner quotes.

## Composition with OutSystems UI patterns

A typical dashboard puts charts inside `CardSectioned` blocks:

```
Columns2.Column1
  └─ CardSectioned (Title = "Requests by Department")
       └─ Content placeholder
            └─ IfWidget(not GetChartData.List.Empty)
                 ├─ TrueBranch:  DonutChart_v2 (bound to GetChartData)
                 └─ FalseBranch: BlankSlate (Icon=bar-chart, Content="No data to display")
```

Always wrap with a "no data" guard via `IfWidget` + `BlankSlate` — empty charts render as a blank rectangle.

## Accessibility

- Charts are visual. Always pair with:
  1. A textual summary above or below ("Sales increased 12% from Q3 to Q4").
  2. A data table fallback (`TableRecords` showing the same data) toggleable by a button.
  3. `aria-label` on the chart container describing what the chart represents.
- Don't use color alone to communicate categories. Use distinct shapes/patterns for color-blind users; the v2 default palette is color-blind-friendly.
- Highcharts ships keyboard navigation for chart points — don't disable it via `AdvancedFormat`.

See [`common/accessibility.md`](../../common/accessibility.md).

## Performance

- **Limit data points.** A line chart with 5000 points is slow on mobile. Aggregate server-side (use `GroupByOperation` on the aggregate) before passing to the chart.
- **Disable animation** on dashboards with multiple charts — animations are pleasant once but overwhelming when six charts animate at once. Set `OptionalConfigs.AnimationDuration: 0` or via `AdvancedFormat: { ""plotOptions"": { ""series"": { ""animation"": false } } }`.
- **Lazy-load** charts behind tabs or accordion items. Gate with `IfWidget(<TabIsActive>)` so the chart doesn't render on the initial paint of unused tabs.

See [`common/ui-performance.md`](../../common/ui-performance.md).

## Anti-patterns

- **Building charts from custom HTML/CSS/JS.** Use the OutSystems Charts blocks — they handle theming, accessibility, exports, and tooltips.
- **One chart per data point.** If you have 12 monthly columns, that's 1 chart with 12 points, not 12 single-point charts.
- **Fitting too many series in one chart.** Above ~5 lines on a line chart, readability collapses — split into small multiples or facet by another dimension.
- **Hardcoded chart colors.** Use the v2 palette (theme-aware) or expose colors via `OptionalConfigs`.
- **Mixing v1 and v2 chart blocks** in the same module — they use different identifier types and config records.

## Reference

- [OutSystems Charts showcase](https://charts.outsystems.com) — interactive examples of every chart type.
- [Charts API v2 reference](https://success.outsystems.com/documentation/11/reference/outsystems_apis/charts_api_v2/charts/) — full per-chart input list.
- [Column chart reference](https://success.outsystems.com/documentation/11/reference/outsystems_apis/charts_api_v2/charts/column_chart/) — example deep-dive.
- [Advanced JSON customization](https://success.outsystems.com/documentation/11/reference/outsystems_apis/charts_api/advanced_charts_customization_with_json/) — escape hatch for arbitrary Highcharts options.
