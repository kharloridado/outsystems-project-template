---
name: osui-recipe-categories-card
description: How to build a parameterized "category tile" — a Card with an icon-in-rounded-square + title + value + footer info, exposed as a reusable block with placeholder slots so each instance fills its own icon, title, count, and footer line. Use when the request mentions "category cards / tiles in a dashboard row", "spending categories grid", "budget category tile", "department / segment cards with icon + label + count", or any 3–6-up grid of icon-led summary tiles where every tile shares the same layout but different content.
---

# Recipe — Categories Card (parameterized tile)

> **Goal:** a reusable `Card` block that renders one row of icon-led summary tiles (think "Food / Transport / Shopping / Entertainment" budget categories, or "Sales / Engineering / Support" department tiles). Each instance fills four placeholder slots — icon, title, count/value, footer info — and inherits the same layout, padding, and `full-height` row-alignment behavior automatically.

> **When to use:** any dashboard row of 3–6 sibling tiles where every tile has the same shape (icon in a colored square + title beside it + primary value below + secondary line below that) but different content per tile. Build the parameterized block ONCE; instantiate N times inside a `Columns*` row, filling the slots per instance. Distinct from `KPICard` (which has a trend pill + previous-period sentence, different shape) and from `CardWithChart` (chart-led analytics tile).

## Trigger phrases

- "Category tiles / category cards in a dashboard row"
- "Spending categories grid" / "budget categories" / "expense categories"
- "Department / team / segment summary cards with icon + count"
- "Icon-led tiles, one per [category / status / type]"
- "3-up or 4-up grid of small tiles, each with icon + title + number"

## What it produces

A reusable block with 4 placeholder slots:

```
Block "CategoriesCard"
  └── Card (from OutSystemsUI/Content, ExtendedClass="full-height")
        ├── Container Style="display-flex column-gap-s align-items-center"  ← header row (icon + title)
        │     ├── Container Width="36px" Style="border-radius-soft display-flex align-items-center justify-content-center"
        │     │     └── PlaceholderWidget "Icon"        ← caller drops an IIcon here
        │     └── PlaceholderWidget "Title"             ← caller drops a TextWidget/Expression here
        ├── Container Style="margin-top-s"
        │     └── PlaceholderWidget "Count"             ← caller drops the big number Expression here
        └── Container Style="margin-top-s"
              └── PlaceholderWidget "Footer"            ← caller drops the secondary info Text here
```

The `Card.ExtendedClass="full-height"` is what makes sibling tiles in a `Columns*` row visually align even when their footer lines wrap differently.

## Building the reusable block (Model API)

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var dashboards = app.MobileFlows.Named("DashboardsAndAnalytics");
    var outSystemsUI = app.References.Named("OutSystemsUI");
    var content = outSystemsUI.MobileFlows.Named("Content");

    var block = dashboards.CreateBlock("CategoriesCard");

    // OPTIONAL — declare an input parameter if the tile should be configurable beyond
    // the placeholder slots (e.g. a "BackgroundColor" arg for the icon square).
    // The reference block has one input parameter — typically for the icon-square tint.
    var iconBgInput = block.CreateInputParameter("IconBackgroundClass");
    iconBgInput.DataType = app.TextType;
    iconBgInput.IsMandatory = false;
    // ExtendedClass for the icon square — pass "background-primary-light", "background-info-light", etc.

    // 1) Outer Card with full-height so siblings in a Columns row match heights.
    var cardSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Card");
    var card = block.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    card.SourceBlock = cardSig;
    card.SetArgumentValue(cardSig.InputParameters.Named("ExtendedClass"), "\"full-height\"");

    var cardContent = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");

    // 2) Header row: 36x36 rounded-square icon slot + title slot, side-by-side.
    var headerRow = cardContent.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    headerRow.SetStyle("\"display-flex column-gap-s align-items-center\"");

    // 2a) Icon square — fixed 36x36, soft-rounded corners, flex-centered.
    var iconSquare = headerRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    iconSquare.Width = "36px";
    iconSquare.SetStyle("\"border-radius-soft display-flex align-items-center justify-content-center \" + IconBackgroundClass");
    // The trailing string-concat puts the caller's "background-*-light" class on the square.

    var iconPh = iconSquare.CreatePlaceholder("Icon");

    // 2b) Title slot — sits to the right of the icon square in the same flex row.
    var titlePh = headerRow.CreatePlaceholder("Title");

    // 3) Count slot — primary value, margin-top-s below the header.
    var countRow = cardContent.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    countRow.SetStyle("\"margin-top-s\"");
    var countPh = countRow.CreatePlaceholder("Count");

    // 4) Footer slot — secondary line, margin-top-s below the count.
    var footerRow = cardContent.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    footerRow.SetStyle("\"margin-top-s\"");
    var footerPh = footerRow.CreatePlaceholder("Footer");
}
```

## Instantiating the block (in a 4-up dashboard row)

```csharp
// On a dashboard screen, inside MainContent:
var columns4Sig = adaptive.Nodes.OfType<IMobileBlockSignature>().Named("Columns4");
var categoriesCardSig = dashboards.Nodes.OfType<IMobileBlockSignature>().Named("CategoriesCard");

var row = mainContent.CreateWidget<IMobileBlockInstanceWidget>();
row.SourceBlock = columns4Sig;
row.SetArgumentValue(columns4Sig.InputParameters.Named("PhoneBehavior"), "Entities.BreakColumns.All");

foreach (var (col, iconName, iconTint, title, count, footer) in new[] {
    ("Column1", "fork-knife",      "background-warning-light", "Food",          "$320",  "12 transactions"),
    ("Column2", "car",             "background-info-light",    "Transport",     "$180",  "8 transactions"),
    ("Column3", "shopping-bag",    "background-primary-light", "Shopping",      "$240",  "5 transactions"),
    ("Column4", "popcorn",         "background-success-light", "Entertainment", "$92",   "3 transactions"),
}) {
    var colPh = row.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == col);

    var tile = colPh.CreateWidget<IMobileBlockInstanceWidget>();
    tile.SourceBlock = categoriesCardSig;
    tile.SetArgumentValue(categoriesCardSig.InputParameters.Named("IconBackgroundClass"),
        $"\"{iconTint}\"");

    // Fill the Icon placeholder with an IIcon.
    var ip = tile.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Icon");
    var iicon = ip.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
    iicon.Icon = iconName;
    iicon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
    iicon.Weight = "regular";

    // Fill the Title placeholder.
    var tp = tile.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Title");
    var titleText = tp.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    titleText.SetStyleClasses("\"font-size-base font-semi-bold\"");
    titleText.Text = title;

    // Fill the Count placeholder (the big number).
    var cp = tile.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Count");
    var countText = cp.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    countText.SetStyleClasses("\"font-size-display font-bold\"");
    countText.Text = count;

    // Fill the Footer placeholder.
    var fp = tile.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Footer");
    var footerText = fp.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    footerText.SetStyleClasses("\"text-neutral-7 font-size-s\"");
    footerText.Text = footer;
}
```

## Decision points when specializing

| Decision | Default | Override when |
|---|---|---|
| **Icon square size** | `36px` width × `36px` (square via flex-center) | `48px` for a hero tile (single tile takes the whole row), `28px` for a denser 6-up grid. |
| **Icon-square shape** | `border-radius-soft` (gently rounded) | `border-radius-rounded` for a fully-circular icon coin; `border-radius-none` for a flat tile look. |
| **Icon-square tint** | Caller-supplied via `IconBackgroundClass` arg (e.g. `background-warning-light`) | Single-color tile sets: skip the arg and hardcode one class on the iconSquare; multi-color: keep the arg and pass per-tile. |
| **`Card.ExtendedClass`** | `"full-height"` (matches row siblings) | Drop `full-height` when the card is used standalone (not in a Columns row). |
| **Header row gap** | `column-gap-s` | `column-gap-base` for chunkier tiles, `column-gap-xs` for dense 6-up grids. |
| **Vertical spacing between rows** | `margin-top-s` (between header / count / footer) | `margin-top-base` for taller cards; collapse `margin-top-s` to `margin-top-xs` for dense tiles. |
| **Number of placeholder slots** | 4 (Icon / Title / Count / Footer) | Drop `Footer` if the design has no secondary line; rename `Count` to `Value` or `Status` if the slot holds something other than a number. |

## Common pitfalls

❌ **Building each tile as a separate hand-rolled `Container` instead of a reusable block.** The whole point of this pattern is that 4 sibling tiles share the SAME layout — extract the structure into one parameterized block with placeholder slots, instantiate N times. Hand-rolling each tile means 4× the widget tree, 4× the change cost when the design tweaks, and inevitable drift between siblings.

❌ **Forgetting `Card.ExtendedClass="full-height"`** when the tile sits inside a `Columns*` row. Without it, a tile whose footer wraps to two lines drops below its siblings and the row visually breaks. See [`../polish-checklist.md`](../polish-checklist.md) item 8c.

❌ **Putting the icon-square's background color inline as `CustomStyle = "background-color: #..."`** instead of using an OS UI utility class via the `IconBackgroundClass` arg. The utility classes (`background-warning-light`, `background-info-light`, `background-primary-light`, etc.) are theme-aware; hex backgrounds drift on theme changes.

❌ **Filling the placeholder slots inside the block definition.** Placeholders are CALLER-fillable — the block defines the shape, the caller fills the content. Putting a hardcoded TextWidget inside the `Title` placeholder *in the block* defeats the parameterization.

❌ **Using `Counter` block for the big number.** `Counter` is for inline metrics in lists/forms — it doesn't have the typography control this tile needs. A plain `TextWidget` with `font-size-display font-bold` gets the right look.

❌ **Skipping the icon-square wrapper and putting the icon directly inside the header row.** The `36px` rounded-square with a tinted background is what makes the tile read as "category-led" rather than "generic stat tile." Without the colored square, it just looks like a KPI card.

❌ **Mixing the parameterized block with hand-rolled tiles in the same row.** All 4 tiles in the row should be `CategoriesCard` instances. If even one is a styled `Container`, theme changes and ExtendedClass updates only propagate to the block instances — the hand-rolled one drifts.

## Related

- [`kpi-card-with-trend.md`](kpi-card-with-trend.md) — sibling pattern for KPI tiles WITH a trend pill (different shape — pick by whether the design shows trend / comparison data).
- [`progress-card.md`](progress-card.md) — when each tile should show a progress bar toward a quota instead of a flat count.
- [`columns-and-cards-dashboard.md`](columns-and-cards-dashboard.md) — composing a full dashboard from multiple tile types in nested `Columns*` rows.
- [`../patterns/adaptive.md`](../patterns/adaptive.md) — `Columns3`/`Columns4` arg reference.
- [`../polish-checklist.md`](../polish-checklist.md) — items 8c (full-height across a row) and 9 (Card family vs styled Container).
