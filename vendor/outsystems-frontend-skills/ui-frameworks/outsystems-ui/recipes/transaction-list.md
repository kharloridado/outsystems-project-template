---
name: osui-recipe-transaction-list
description: How to build a list of transaction-style rows (merchant icon + name + meta + amount with success/error coloring) using the IList widget over a screen aggregate, with ListItemContent block per row inside an Animate addon for staggered fade-in. Use when the request mentions "recent transactions", "activity feed", "transaction list", "list of payments / orders / messages with icon + amount", or any "icon + title + meta + right-aligned value" list shape backed by entity data.
---

# Recipe — Transaction List (Data-Driven Activity Feed)

> **Goal:** the canonical OutSystems UI pattern for a list of transaction-shape rows — merchant/sender icon on the left, description + meta in the middle, amount on the right (green for credits, red for debits) — bound to a real entity aggregate with staggered fade-in animation. This is the right answer for transactions, activity feeds, message lists, order lists, payment lists.

> **When to use:** anywhere the request describes a list of similar rows where each row has an icon, a title, secondary text (date / category / status), and a right-aligned value or status badge. **If you're about to write a flex-column of `<div class="tx-row">` divs with hardcoded content, stop.**

## Trigger phrases

- "Recent transactions / activity feed / transactions list"
- "List of payments / orders / messages / notifications"
- "Each row has merchant icon + name + date + amount"
- "Negative amounts in red, positive in green"
- "Transaction rows animate in with staggered fade"
- "Filtered to the active card / account / user"

## Step 0 — discover sample data BEFORE writing the aggregate

Most "list of <thing>" prompts can be backed by an entity that already exists in **`OutSystemsSampleData`** — a reference that's typically present in any newly-generated app. Before mocking ANY data, probe that reference for a matching entity:

```csharp
var sampleData = eSpace.GetESpace().References.NamedOrDefault("OutSystemsSampleData");
if (sampleData != null) {
    var entityNames = sampleData.Entities
        .OfType<OutSystems.Model.Data.IServerEntitySignature>()
        .Concat<OutSystems.Model.Data.IEntitySignature>(
            sampleData.Entities.OfType<OutSystems.Model.Data.IStaticEntitySignature>())
        .Select(e => e.Name).OrderBy(n => n).ToList();
    // Inspect entityNames — pick the closest match for the screen's domain.
}
```

**Common matches** in `OutSystemsSampleData`:

| Screen asks for… | Likely sample entity |
|---|---|
| Transactions / payments / activity feed | `Sample_Transaction` (+ `Sample_Accounts`, `Sample_Employee`, `Sample_TransactionType`) |
| Users / employees / contacts / team list | `Sample_Employee` |
| Products / catalog / orders | `Sample_Product`, `Sample_Order`, `Sample_OrderItem` |
| Cards / accounts | `Sample_Accounts` |
| Categories / status / types (static lookups) | `Sample_TransactionType`, `Sample_Department`, etc. |

**Decision tree:**

1. Sample entity matches the request closely → use the canonical recipe below (entity bindings, joins, `<Aggregate>.List.Current.<Entity>.<Field>`).
2. Sample entity is *close but not exact* (e.g. request is "subscriptions list" but `Sample_Transaction` is the closest) → STILL use it, just tweak labels (e.g. show `Sample_Transaction.Description` as the subscription name). Better than mocking from scratch.
3. No reasonable match exists → fall back to "When you don't have an entity to bind to — mock with literal records" below. **Never skip the IList — mock the source instead.**

## What it produces

A `CardSectioned` (or section-shaped `Card`) whose `Content` placeholder hosts an **`IList` widget** bound to a screen aggregate. Each list row is wrapped in **`Animate`** (FadeIn, staggered delay) and renders a **`ListItemContent`** block with four placeholders: `Left` (icon container), `Title` (description Expression), `Content` (meta row Expression), `Right` (amount Expression with conditional color). All values come from the aggregate via `<Aggregate>.List.Current.<entity>.<field>` bindings.

## Skeleton tree

```
ScreenAggregate "GetLastTransactions"
├── Source: Sample_Transaction
├── Joined: Sample_Accounts (as Source_Account, Destination_Account),
│           Sample_Employee (as Sender, Receiver), Sample_TransactionType
├── Sort: Sample_Transaction.Date desc (or "TableSort")
└── MaxRecords/StartIndex: bound to local vars for pagination

CardSectioned (header has section title + "See all →" link)
└── Content placeholder
    └── IList   Source = "GetLastTransactions.List"
        └── Animate   AnimationType = FadeIn,  Delay = .CurrentRowNumber * 50
            └── IListItem   Style="list-item padding-s border-radius-soft border-size-none"
                └── ListItemContent (block from OutSystemsUI/Content)
                    ├── Left placeholder
                    │   └── Container (40×40, border-size-s border-radius-softer background-neutral-2)
                    │       └── IIcon (Phosphor name from category/merchant, FontSize)
                    ├── Title placeholder
                    │   └── Expression (font-size-s) ← .Sample_Transaction.Description
                    ├── Content placeholder
                    │   └── Container (display-flex column-gap-s font-size-xs text-neutral-5)
                    │       ├── Expression ← .Sample_TransactionType.Label
                    │       ├── Container (2×2 dot, background-neutral-5)
                    │       └── Expression ← FormatDateTime(.Date, "d MMM")
                    └── Right placeholder
                        └── Expression
                              SetStyle = "font-bold " + If(<credit-condition>, "text-success ", "text-error ")
                              SetValue = If(<credit-condition>, "+ ", "- ") + FormatCurrency(.Amount, "$", 2, ".", ",")
```

## Building it (Model API)

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var sampleData = app.References.Named("OutSystemsSampleData");
    var outSystemsUI = app.References.Named("OutSystemsUI");
    var content = outSystemsUI.MobileFlows.Named("Content");
    var interaction = outSystemsUI.MobileFlows.Named("Interaction");

    // Entity refs
    var txEntity      = sampleData.Entities.OfType<OutSystems.Model.Data.IServerEntitySignature>().Named("Sample_Transaction");
    var acctEntity    = sampleData.Entities.OfType<OutSystems.Model.Data.IServerEntitySignature>().Named("Sample_Accounts");
    var empEntity     = sampleData.Entities.OfType<OutSystems.Model.Data.IServerEntitySignature>().Named("Sample_Employee");
    var typeEntity    = sampleData.Entities.OfType<OutSystems.Model.Data.IStaticEntitySignature>().Named("Sample_TransactionType");

    // 1) Aggregate — joined to give us description, type label, sender/receiver, source/destination.
    var agg = screen.CreateScreenAggregate(false, "GetLastTransactions");
    agg.SetMaxRecords("5");                         // page size
    agg.SetStartIndex("StartIndex");                // local var
    agg.Fetch = OutSystems.Model.Enumerations.DataSourceFetch.AtStart;

    var txSrc       = agg.AsDatabaseAggregate.CreateSource(txEntity);
    var srcAcct     = agg.AsDatabaseAggregate.CreateSource(acctEntity, "Source_Account");
    var dstAcct     = agg.AsDatabaseAggregate.CreateSource(acctEntity, "Destination_Account");
    var sender      = agg.AsDatabaseAggregate.CreateSource(empEntity, "Sender");
    var receiver    = agg.AsDatabaseAggregate.CreateSource(empEntity, "Receiver");
    var typeSrc     = agg.AsDatabaseAggregate.CreateSource(typeEntity);

    // LEFT joins so transactions without a destination/sender still appear.
    var j1 = agg.AsDatabaseAggregate.CreateJoin();
    j1.LeftSource = txSrc; j1.RightSource = srcAcct;
    j1.JoinType = OutSystems.Model.Enumerations.JoinType.Left;
    j1.SetCondition("Sample_Transaction.SourceAccount = Source_Account.Id");

    var j2 = agg.AsDatabaseAggregate.CreateJoin();
    j2.LeftSource = txSrc; j2.RightSource = dstAcct;
    j2.JoinType = OutSystems.Model.Enumerations.JoinType.Left;
    j2.SetCondition("Sample_Transaction.DestinationAccount = Destination_Account.Id");

    var j3 = agg.AsDatabaseAggregate.CreateJoin();
    j3.LeftSource = txSrc; j3.RightSource = typeSrc;
    j3.JoinType = OutSystems.Model.Enumerations.JoinType.Left;
    j3.SetCondition("Sample_Transaction.Type = Sample_TransactionType.Id");

    agg.AsDatabaseAggregate.CreateSort().SetAttribute("TableSort");  // newest first

    // 2) Wrapping CardSectioned (assume cardSectionedInstance already created with Title placeholder filled).
    var cardContentPh = cardSectionedInstance.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");

    // 3) The IList — bound to the aggregate.
    var list = cardContentPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IList>();
    list.SetSource("GetLastTransactions.List");
    list.AnimateItems = false;   // we'll handle per-row animation via the Animate block
    // SetStyle defaults to "list list-group" — leave default for theme-correct list styling.

    // 4) Animate block per row — staggered FadeIn.
    var animateSig = interaction.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Animate");
    var animate = list.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    animate.SourceBlock = animateSig;
    animate.SetArgumentValue(animateSig.InputParameters.Named("AnimationType"), "Entities.AnimationType.FadeIn");
    animate.SetArgumentValue(animateSig.InputParameters.Named("Delay"),
        "GetLastTransactions.List.CurrentRowNumber * 50");
    // Speed left at default.

    var animateContentPh = animate.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");

    // 5) IListItem — the actual row primitive.
    var listItem = animateContentPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IListItem>("ListItem1");
    // CRITICAL: clear default RightActions widgets to avoid empty swipe-action stubs.
    listItem.RightActions.Widgets.ToList().ForEach(w => w.Delete());
    listItem.SetStyle("\"list-item padding-s border-radius-soft border-size-none\"");

    // 6) ListItemContent block — gives Left / Title / Content / Right placeholders.
    var lic = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("ListItemContent");
    var licInst = listItem.Content.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    licInst.SourceBlock = lic;
    // ExtendedClass left at default.

    // 7) Left placeholder — 40×40 icon container.
    var leftPh = licInst.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Left");
    var iconWrap = leftPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    iconWrap.CustomStyle = "height: 40px;";
    iconWrap.Width = "40px";
    iconWrap.SetStyle("\"display-flex align-items-center justify-content-center "
                    + "border-size-s border-radius-softer text-neutral-4 background-neutral-2\"");

    var icon = iconWrap.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
    icon.Icon = "hamburger";   // or pick by category — see decision-points table
    icon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
    icon.Weight = "regular";
    icon.SetStyle("\"icon text-neutral-7\"");

    // 8) Title placeholder — transaction description.
    var titlePh = licInst.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Title");
    var titleExpr = titlePh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IExpression>();
    titleExpr.SetStyle("\"font-size-s\"");
    titleExpr.SetValue("GetLastTransactions.List.Current.Sample_Transaction.Description");

    // 9) Content placeholder — type label + tiny dot + relative date.
    var contentPh = licInst.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");
    var metaRow = contentPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    metaRow.SetStyle("\"display-flex align-items-center column-gap-s font-size-xs text-neutral-5\"");

    var typeExpr = metaRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IExpression>();
    typeExpr.SetStyle("\"\"");
    typeExpr.SetValue("GetLastTransactions.List.Current.Sample_TransactionType.Label");

    // The 2x2 separator dot.
    var dot = metaRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    dot.CustomStyle = "height: 2px;";
    dot.Width = "2px";
    dot.SetStyle("\"border-radius-circle border-size-s background-neutral-5 text-neutral-5\"");

    var dateExpr = metaRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IExpression>();
    dateExpr.SetValue("FormatDateTime(GetLastTransactions.List.Current.Sample_Transaction.Date, \"d MMM\")");

    // 10) Right placeholder — amount with credit/debit color.
    var rightPh = licInst.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Right");
    var amountExpr = rightPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IExpression>();
    // Credit when this account is the destination (money in); debit when it's the source.
    amountExpr.SetStyle(
        "\"font-bold \" + If(GetLastTransactions.List.Current.Sample_Transaction.SourceAccount = "
        + "GetLastTransactions.List.Current.Destination_Account.Id, \"text-success \", \"text-error \")");
    amountExpr.SetValue(
        "If(GetLastTransactions.List.Current.Sample_Transaction.SourceAccount = "
        + "GetLastTransactions.List.Current.Destination_Account.Id, \"+ \", \"- \") + "
        + "FormatCurrency(GetLastTransactions.List.Current.Sample_Transaction.Amount, \"$\", 2, \".\", \",\")");
}
```

## Decision points

| Decision | Default | Override when |
|---|---|---|
| **Wrapper** | `CardSectioned` (Title + Content + Footer) — gives a "section" visual with a title row and a "See all →" link in the title's right column | `Card` (single Content placeholder) when there's no separate header / "See all" action. |
| **Aggregate `MaxRecords`** | `"5"` (preview list on a dashboard) | `"20"` for a dedicated transactions screen; bind to a `MaxRecords` local var if pagination is wired. |
| **Sort** | `Sample_Transaction.Date desc` (or `TableSort`) | Domain-specific (e.g. "by amount desc" for high-value alerts). |
| **`Animate.Delay` formula** | `.CurrentRowNumber * 50` (50ms stagger) | `* 100` for a slower cinematic cascade; remove animate entirely for >50-row pages (compounds slowly). |
| **Left icon** | A neutral category icon (`hamburger`, `forkknife`, `train`, `shopping-cart`) | Bind dynamically — `If(...Type.Label = "Food", "forkknife", If(...Label = "Transport", "train", "circle"))` — when the category drives the icon. |
| **Credit/debit detection** | Compare `.SourceAccount` to current account id (or `Destination_Account.Id` if joined) | Use a dedicated `IsCredit` boolean on the entity if it's already there. |
| **Date format** | `"d MMM"` (Wed 5 May → "5 May") | `"d MMM, h:mm tt"` for activity feeds where time-of-day matters. |
| **Currency format** | `FormatCurrency(.Amount, "$", 2, ".", ",")` | Match the screen's locale: `"€"`, `"£"`, etc. |
| **`CardItem` instead of `ListItemContent`** | `ListItemContent` (this recipe) when inside an `IList` | `CardItem` standalone (not in a list) when the row is a one-off section element rather than data-driven repeating rows. See [`patterns/content.md#carditem`](../patterns/content.md#carditem). |

## Filtering by active account / card

For "transactions for the active card" or "filtered by selected account," add a filter to the aggregate:

```csharp
agg.AsDatabaseAggregate.CreateFilter(
    "ActiveCardId = NullIdentifier() or Sample_Transaction.SourceAccount = ActiveCardId");
```

`ActiveCardId` is a local variable on the screen, set when the user picks a card from a carousel. Use the same `RefreshTable`-style action pattern from [`recipes/gallery-with-filters.md`](gallery-with-filters.md) to drive `RefreshData(GetLastTransactions)` on selection change.

## When you don't have an entity to bind to — mock with literal records

> ⚠️ **Do NOT remove the `IList` and replace with hardcoded `<div>` rows** when no real entity matches. The list block accepts any `Record List` expression as its `Source` — including a `LocalVariable` populated with a `ListLiteral` of `RecordLiteral`s. Use that to mock data and **keep the real `IList` + `IListItem` + `ListItemContent` structure**. Removing the list costs you keyboard nav, swipe-actions, accessibility, theme styling, and a clean swap-to-real-data path. Mocked-but-real-list always beats hand-rolled-fake-rows.

**Canonical mock pattern**:

1. **Define (or reuse) a Structure** that matches the row shape. If one of the `OutSystemsSampleData` structures fits (often the entity itself is reusable as a row shape), use it. Otherwise create a local Structure on the screen's eSpace:

    ```csharp
    var struct = eSpace.GetESpace().Structures.Create("MockTransactionRow");
    struct.Attributes.Create("Description", BasicType.Text);
    struct.Attributes.Create("Category",    BasicType.Text);
    struct.Attributes.Create("Date",        BasicType.DateTime);
    struct.Attributes.Create("Amount",      BasicType.Decimal);
    struct.Attributes.Create("IsCredit",    BasicType.Boolean);
    ```

2. **Add a LocalVariable on the screen** typed as `MockTransactionRow List` (or `<MatchingEntity> List` if reusing a sample entity's structure):

    ```csharp
    var mockList = screen.LocalVariables.Create("MockTransactions");
    mockList.DataType = /* MockTransactionRow List type */;
    ```

3. **Populate it in `OnInitialize` (or `OnReady`)** with a `ListLiteral` of `RecordLiteral`s:

    ```csharp
    var assign = onInitAction.CreateNode<IAssignNode>();
    assign.AssignTo("MockTransactions",
        new ExpressionDefinition.ListLiteral([
            new ExpressionDefinition.RecordLiteral([
                ("Description", "\"Netflix\""),
                ("Category",    "\"Subscription\""),
                ("Date",        "#2026-01-12#"),
                ("Amount",      "14.99"),
                ("IsCredit",    "False"),
            ]),
            new ExpressionDefinition.RecordLiteral([
                ("Description", "\"Salary\""),
                ("Category",    "\"Income\""),
                ("Date",        "#2026-01-10#"),
                ("Amount",      "3200.00"),
                ("IsCredit",    "True"),
            ]),
            // ...4–5 rows of varied content (positive + negative amounts, varied categories)
        ]));
    ```

4. **Bind `IList.Source` to the LocalVariable**:

    ```csharp
    list.SetSource("MockTransactions");
    ```

5. **Update `ListItemContent` bindings** to read from the local var instead of the aggregate path:
    - `titleExpr.SetValue("MockTransactions.Current.Description");`
    - `dateExpr.SetValue("FormatDateTime(MockTransactions.Current.Date, \"d MMM\")");`
    - `amountExpr.SetValue("If(MockTransactions.Current.IsCredit, \"+ \", \"- \") + FormatCurrency(MockTransactions.Current.Amount, \"$\", 2, \".\", \",\")");`
    - `amountExpr.SetStyle("\"font-bold \" + If(MockTransactions.Current.IsCredit, \"text-success \", \"text-error \")");`

The list renders identically whether the source is a real aggregate or a literal mock. **Mock first, swap to a real `ScreenAggregate` once an entity exists** — never replace the list with `<div>` rows.

**Realistic content matters.** When mocking, populate 4–5 rows with varied, plausible content — different merchants, mixed credits and debits, recent dates. Empty / single-row / "Sample 1, Sample 2" mocks make the screen look broken even though the structure is right. See [`polish-checklist.md`](../polish-checklist.md) item #5.

## Common pitfalls

❌ **Hand-rolling rows as `<div class="tx-row">` divs in a flex column** instead of using `IList` + `IListItem` + `ListItemContent`. You lose: keyboard navigation, swipe-actions, virtualization (for large lists), accessibility roles, theme-correct row styling.

❌ **Removing the `IList` because no entity matched the prompt's domain** + replacing with a flex-column of hardcoded `<div>` rows. Mock the list source via a LocalVariable populated with `ListLiteral` of `RecordLiteral`s and **keep the real list block** (see "When you don't have an entity to bind to" above). The list renders identically whether the source is real or mocked, and you preserve the swap-to-real-data path.

❌ **Skipping the `OutSystemsSampleData` discovery step.** Most "list of <thing>" prompts can be backed by an existing sample entity (`Sample_Transaction`, `Sample_Employee`, `Sample_Product`, etc.). Always probe `eSpace.References.NamedOrDefault("OutSystemsSampleData")` first; mock-data is a third-tier fallback after (1) exact match and (2) close-enough match with relabeled fields. See "Step 0 — discover sample data" above.

❌ **Hardcoding row content directly in `IListItem` placeholders** instead of either binding to an aggregate OR a mocked LocalVariable list. Either path keeps the list data-driven; inline hardcoded content makes every row identical and breaks the "varies per row" semantics that lists exist to express.

❌ **Forgetting to clear `IListItem.RightActions.Widgets` defaults.** `IListItem` ships with default swipe-action stubs that render as empty boxes. Always:
```csharp
listItem.RightActions.Widgets.ToList().ForEach(w => w.Delete());
```

❌ **Hardcoding the credit/debit color** (`text-success` literally) instead of computing it from the row's data. Use the `If(...)` expression on `SetStyle` so each row's amount color reflects whether it's a credit or debit.

❌ **Putting the `Animate` block at the screen level instead of per-row inside the `IList`.** The `.CurrentRowNumber * 50` stagger only works when Animate fires per row. A single screen-level Animate animates the whole list as one block, losing the cascade effect.

❌ **Using `text-success` / `text-error` Tag block for the amount** instead of styling the Expression directly. Tags are for short status pills (e.g. "Pending"), not for currency amounts. Style the Expression with `text-success` / `text-error` utility classes.

❌ **Forgetting the meta-row separator dot.** The pattern is `<type label> · <date>` with a tiny circular dot between. The dot is a `Container` with `width: 2px; height: 2px; border-radius-circle; background-neutral-5`. It's small but visually important — the meta line looks too dense without it.

❌ **Skipping the LEFT joins on accounts/sender/receiver** and using inner joins. Inner joins drop transactions that are missing one side (e.g. a deposit with no source account). LEFT joins ensure every transaction renders.

❌ **Hardcoding the icon for every row** — `icon.Icon = "shopping-cart"` literally. The whole point of binding to data is per-row variety. Either pick a single neutral icon (`hamburger`) or compute via `If(...)` on the transaction type / category / merchant name.

❌ **Putting the "See all transactions →" link inside `IList`** so it appears on every row. The link belongs in the `CardSectioned.Title` placeholder (top-right of the section header), or in a dedicated Footer container — once per section, not per row.

## Related

- [`patterns/content.md#listitemcontent`](../patterns/content.md#listitemcontent) — full ListItemContent arg + placeholder reference.
- [`patterns/interaction.md`](../patterns/interaction.md) — `Animate` block options (AnimationType / Speed / Delay).
- [`recipes/gallery-with-filters.md`](gallery-with-filters.md) — the larger pattern for aggregate-driven screens with filters + pagination, of which this transaction list is the per-row sub-pattern.
