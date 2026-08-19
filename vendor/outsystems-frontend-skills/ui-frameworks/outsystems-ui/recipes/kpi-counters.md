---
name: osui-recipe-kpi-counters
description: How to build KPI / stat blocks (number + label, optional trend indicator) using the Counter block. Use when the request mentions "KPI", "stat box", "metric card", "show the number of …", "balance display", or any "big number with a label" pattern.
---

# Recipe — KPI Counters

> **Goal:** display a single statistic / KPI as a big number with a label and optional trend indicator. The OutSystems UI canonical shape is the `Counter` block — **never** a `Container` with manually-sized text.

## When to use this recipe

Trigger phrases:

- "KPI cards", "metric cards", "stat boxes"
- "Show the total / count / balance / number of …"
- "Three big numbers across the top of the dashboard"
- A balance display with a large amount and a small currency / label below
- The counter section of a `Dashboard` or `AdminDashboard` template

## What you'll build

```
Columns3 (or Columns2 / Columns4) for the row of KPIs
  Column1
    Counter (block instance)
      Counter.IsVertical = True
      └── Counter.Content (placeholder)
            ├── Number text
            ├── Label text
            └── Optional: trend Icon
  Column2
    Counter …
  Column3
    Counter …
```

## Required references

Both blocks live in `OutSystemsUI`. Look them up via the canonical pattern in [`../blocks-index.md#how-to-look-up-an-os-ui-block-the-lookup-pattern`](../blocks-index.md#how-to-look-up-an-os-ui-block-the-lookup-pattern).

| Block | OutSystemsUI flow | Key args | Key placeholders |
|---|---|---|---|
| `Counter` | `Numbers` | `Counter.IsVertical`, `Counter.ExtendedClass` | `Counter.Content` |
| `Columns3` (or `Columns2` / `Columns4`) | `Adaptive` | `Columns3.GutterSize`, `Columns3.BreakColumns` | `Columns3.Column1`, `Columns3.Column2`, `Columns3.Column3` |

For full API see [`../patterns/numbers.md#counter`](../patterns/numbers.md#counter) and [`../patterns/adaptive.md`](../patterns/adaptive.md) (Columns).

## C# template

```csharp
// 1) Look up signatures
var app          = eSpace.GetESpace();
var outSystemsUI = app.References.Named("OutSystemsUI");
var numbersFlow  = outSystemsUI.MobileFlows.Named("Numbers");
var adaptiveFlow = outSystemsUI.MobileFlows.Named("Adaptive");

var counterSig = numbersFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "Counter");
var columns3Sig = adaptiveFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "Columns3");

// 2) Three KPI counters across, inside MainContent
// SetArgumentValue takes (IInputParameterSignature, ExpressionDefinition).
// Look up the parameter by BARE name; strings implicitly convert to ExpressionDefinition.
var row = mainContent.CreateWidget<IMobileBlockInstanceWidget>("KpiRow");
row.SourceBlock = columns3Sig;
row.SetArgumentValue(row.SourceBlock.InputParameters.Named("GutterSize"),   "Entities.GutterSize.Base");
row.SetArgumentValue(row.SourceBlock.InputParameters.Named("BreakColumns"), "Entities.BreakColumns.All");  // collapse to 1-up on narrow

void AddCounter(string columnNumber, string number, string label)
{
    // Runtime PlaceholdersContent uses BARE names (not "Columns3.Column1"). See blocks-index.md.
    var col = row.PlaceholdersContent
        .FirstOrDefault(p => p.Placeholder == $"Column{columnNumber}");

    var counter = col.CreateWidget<IMobileBlockInstanceWidget>($"Kpi_Col{columnNumber}");
    counter.SourceBlock = counterSig;
    counter.SetArgumentValue(counter.SourceBlock.InputParameters.Named("IsVertical"), "True");

    var content = counter.PlaceholdersContent
        .FirstOrDefault(p => p.Placeholder == "Content");  // BARE name

    var num = content.CreateWidget<IAdvancedHtml>("Num");
    num.Tag = "strong";
    // Set inner text via the AdvancedHtml content collection per its API.

    var lbl = content.CreateWidget<IText>("Lbl");
    lbl.Value = $"\"{label}\"";
}

AddCounter("1", "£12,500.00", "British Pound");
AddCounter("2", "S$8,420.50", "Singapore Dollar");
AddCounter("3", "$25,100.00", "US Dollar");
```

> **Block-argument note:** `SetArgumentValue` is an extension with signature `(IInputParameterSignature, ExpressionDefinition)`. Look up the parameter by **bare name** on `inst.SourceBlock.InputParameters.Named("…")`. Strings implicitly convert to `ExpressionDefinition`. See [`../blocks-index.md`](../blocks-index.md) for the canonical pattern.

## Anti-patterns to AVOID

❌ `Container` with `<h1>£12,500</h1>` + `<small>British Pound</small>` and custom CSS for spacing/alignment. **`Counter` exists for this**, gives you theme-consistent sizing, optional trend indicators, and responsive behavior.

❌ Three sibling `Container`s with `flex: 1` and manual gap CSS. Use `Columns3` (or `Columns2` / `Columns4`) — automatic responsive collapse with `BreakColumns`.

❌ Hardcoded font sizes / colors on the number. Use `Counter`'s default styling — overriding via `ExtendedClass` only when truly needed.

❌ Mixing `Counter` for some KPIs and custom `Container`s for others on the same dashboard. Visual inconsistency that reviewers will flag.

## Related

- For a horizontally-laid-out counter (number + label side-by-side instead of stacked), set `Counter.IsVertical = False`.
- For multiple counters with shared chart context (KPI row + chart card + recent-items list), wrap them inside `LayoutSideMenu.MainContent` (see [`../layouts.md`](../layouts.md)).
- For badges / tag-style numeric labels (small notification counts), use `Tag` ([`../patterns/content.md#tag`](../patterns/content.md#tag)) — not `Counter`.
- For progress indicators (percentage rings, bars), use `ProgressCircle` / `ProgressBar` ([`../patterns/numbers.md`](../patterns/numbers.md)).
