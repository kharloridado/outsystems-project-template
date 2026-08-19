---
name: osui-recipe-gallery-with-filters
description: How to build a data-driven product / item gallery screen with category filter pills, price-range filter, search keyword, paginated grid of CardSectioned tiles with animate-on-scroll, and a Clear Filters action. Covers two screen aggregates with multiple joins/filters, six local variables for filter state, two screen actions (RefreshTable with reset branching + PaginationOnNavigate), Gallery block + Pagination block + Animate addon, and conditional Tag styling. Use when the request mentions "gallery", "product grid with filters", "filterable list", "search + filter + paginate", "category pills", "items grid with price range", "clear filters link".
---

# Recipe — Gallery with Filters (Search + Filter + Paginate)

> **Goal:** the canonical OutSystems UI gallery screen — a 4-up grid of product / item cards with **search keyword + category filter + price-range filter + pagination**. All filters drive a single `RefreshData` call; pagination uses a separate action; grid uses the `Gallery` block; cards use `CardSectioned` with image + title + price; entry animation uses the `Animate` addon block.

> **When to use:** any "browse items" / "list with filters" screen — products, articles, listings, courses, properties, jobs, anything where users narrow a list by category + price + keyword and paginate through results. This is the screen-level recipe; it composes blocks and builds the screen-side data plumbing.

## Trigger phrases

- "Gallery / grid of [products / articles / items] with filters"
- "Filterable [list / grid / catalog]"
- "Search + filter + paginate" / "products with category and price filter"
- "Category pills / filter chips at the top, items below"
- "Clear filters link" / "reset filters action"
- "Items grid with price range slider"
- "Animate items into the grid" / "fade-in on scroll"
- **"Tabs / segmented switcher above a card row, with prev/next arrows"** — when selecting an option *filters* the cards instead of *swapping a content panel*, this is filter-pills-over-a-gallery, NOT the `Tabs` block. Tell-tales: pill row sits next to pagination arrows, the region below is a single card grid shared across pill states (only the filter differs), the "other" pill state isn't drawn anywhere as a distinct panel.

## When NOT to use this recipe (use `Tabs` instead)

- The pill row labels distinct content REGIONS that swap below — "Overview" / "Details" / "Reviews" each rendering a different layout. That's `Tabs` (header item + content item pairs), not filter pills. See [`tab-switcher.md`](tab-switcher.md).
- The "second state" of the switcher is drawn somewhere in the design as a separate panel mock. Tabs swaps panels; filter pills don't.

## What it produces

A screen with:
- **Title**: "Product Overview" (or domain equivalent).
- **Actions slot**: a conditional `Clear Filters` link (only when filters are active).
- **Body**:
  1. A **horizontal list of category Tags** (one per category, with conditional active styling). Click a Tag → filter by that category.
  2. A **`Gallery` block** (4 desktop / 2 tablet / 1 phone) containing a `List` over the filtered/paginated aggregate. Each list item is wrapped in `Animate` (fade-in with row-staggered delay) and renders a `CardSectioned` with product image + name + price.
  3. A **`Pagination` block** with custom Phosphor `caret-left` / `caret-right` icons, wired to a pagination action.

Plus the **screen-side data plumbing**:
- Two aggregates (categories with counts, products by filter).
- Six local variables (search keyword, category, min/max price, max records, start index).
- Two screen actions (`RefreshTable` with branching reset logic, `PaginationOnNavigate`).

## Skeleton tree

```
Screen "GalleryWithFilters"
├── Aggregates
│   ├── GetProductCategories (Source: ProductCategory + LEFT JOIN Product, Filter: search,
│   │     GroupBy: Category, CategoryName, Order; Aggregated: Count of Id)
│   └── GetProductsByCategory (Source: Product + LEFT JOIN ProductCategory + LEFT JOIN ProductMainImage,
│         Filters: Category, MinPrice, MaxPrice, SearchKeyword;
│         Sort: Product.Name; MaxRecords/StartIndex bound to local vars)
├── LocalVariables
│   ├── SearchKeyword (Text)
│   ├── ProductCategory (ProductCategory.Identifier)
│   ├── MinPriceSelected (Currency, default 0)
│   ├── MaxPriceSelected (Currency, default 1600)
│   ├── MaxRecords (Integer, default 12)
│   └── StartIndex (Integer)
├── ScreenActions
│   ├── PaginationOnNavigate(NewStartIndex)
│   │     Start → Assign StartIndex=NewStartIndex → RefreshData(GetProductsByCategory) → End
│   └── RefreshTable(ResetFilters, ResetPagination, Category, MinValue, MaxValue, NewStartIndex)
│         Start → Assign(ProductCategory=Category, MinPriceSelected=MinValue, MaxPriceSelected=MaxValue, StartIndex=NewStartIndex)
│              → If(ResetFilters) → True: Assign(SearchKeyword="", Category=NullIdentifier(), Min=0, Max=1600)
│                                  False:
│              → If(ResetPagination) → True: Assign(StartIndex=0) → RefreshData
│                                     False: → RefreshData → End
└── Widgets
    └── LayoutTopMenu
        ├── Header → Menu block (delete defaults first)
        ├── Title → AdvancedHtml h1 "Product Overview"
        ├── Actions → IfWidget (cond: any filter active)
        │              True → Link "Clear Filters" → RefreshTable(ResetFilters=True, ResetPagination=True, …)
        └── MainContent
            ├── List over GetProductCategories.List (horizontal flex layout)
            │   └── Container → Link → Tag block
            │                            (Color: If(active, Primary, Neutral7),
            │                             IsLight: If(NOT active, True, False))
            │                            Tag.Tag placeholder → Expression(.CategoryName)
            │                  Link.OnClick → RefreshTable(Category=.Category, ResetFilters=False, …)
            ├── Gallery block (RowItemsDesktop=4, RowItemsTablet=2, RowItemsPhone=1, ExtendedClass="margin-top-m")
            │   └── List over GetProductsByCategory.List (disable-virtualization=True)
            │       └── Animate block (FadeIn, Delay = .CurrentRowNumber * 100)
            │           └── CardSectioned (ImagePadding=False, ExtendedClass="align-center")
            │               ├── Image placeholder → Image (Type=Binary, source=.Sample_ProductMainImage.File, alt="")
            │               ├── Title placeholder → Container (text-align: center)
            │               │                       → Expression(.Sample_Product.Name) Style="heading6"
            │               └── Content placeholder → Container (text-align: center)
            │                                         → Expression(FormatCurrency(.Price, "$", 2, ".", ",")) Style="heading4"
            └── Pagination block (MaxRecords, TotalCount=GetProductsByCategory.Count, StartIndex bound)
                ├── Previous placeholder (delete default) → Icon "caret-left" weight=fill
                ├── Next placeholder (delete default) → Icon "caret-right" weight=fill
                └── OnNavigate event → PaginationOnNavigate(NewStartIndex=NewStartIndex)
```

## Building it (Model API) — data plumbing

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var mainFlow = app.MobileFlows.Named("MainFlow");
    var sampleData = app.References.Named("OutSystemsSampleData");

    var productEntity = sampleData.Entities.OfType<OutSystems.Model.Data.IServerEntitySignature>().Named("Sample_Product");
    var productCategoryEntity = sampleData.Entities.OfType<OutSystems.Model.Data.IStaticEntitySignature>().Named("Sample_ProductCategory");
    var productImageEntity = sampleData.Entities.OfType<OutSystems.Model.Data.IServerEntitySignature>().Named("Sample_ProductMainImage");

    // 1) Screen scaffold.
    var screen = mainFlow.CreateScreen("GalleryWithFilters");
    screen.Widgets.ToList().ForEach(w => w.Delete());
    screen.SetTitle("\"Four Column Gallery\"");

    // 2) Aggregate A — categories with counts. JOIN Product LEFT to filter categories by search.
    var getCategories = screen.CreateScreenAggregate(false, "GetProductCategories");
    getCategories.SetMaxRecords("50");

    var catSrc = getCategories.AsDatabaseAggregate.CreateSource(productCategoryEntity);
    var catProductSrc = getCategories.AsDatabaseAggregate.CreateSource(productEntity);

    var join = getCategories.AsDatabaseAggregate.CreateJoin();
    join.LeftSource = catProductSrc; join.RightSource = catSrc;
    join.JoinType = OutSystems.Model.Enumerations.JoinType.Left;
    join.SetCondition("Sample_ProductCategory.Id = Sample_Product.Category");

    getCategories.AsDatabaseAggregate.CreateFilter("Sample_Product.Name like \"%\" + SearchKeyword + \"%\"");
    getCategories.AsDatabaseAggregate.CreateGroupByAttribute("Category").SetAttribute("Sample_ProductCategory.Id");
    getCategories.AsDatabaseAggregate.CreateGroupByAttribute("CategoryName").SetAttribute("Sample_ProductCategory.Label");
    getCategories.AsDatabaseAggregate.CreateGroupByAttribute("Order").SetAttribute("Sample_ProductCategory.Order");
    var count = getCategories.AsDatabaseAggregate.CreateAggregatedAttribute("Count");
    count.SetAttribute("Sample_ProductCategory.Id");
    count.AggregationType = AggregationType.Count;

    // 3) Aggregate B — products filtered by category, price range, keyword. Joined to ProductCategory + ProductMainImage.
    var getProducts = screen.CreateScreenAggregate(false, "GetProductsByCategory");
    getProducts.SetMaxRecords("MaxRecords");
    getProducts.SetStartIndex("StartIndex");

    var prodSrc = getProducts.AsDatabaseAggregate.CreateSource(productEntity);
    var prodCatSrc = getProducts.AsDatabaseAggregate.CreateSource(productCategoryEntity);
    var prodImgSrc = getProducts.AsDatabaseAggregate.CreateSource(productImageEntity);

    var prodJoin1 = getProducts.AsDatabaseAggregate.CreateJoin();
    prodJoin1.LeftSource = prodSrc; prodJoin1.RightSource = prodCatSrc;
    prodJoin1.JoinType = OutSystems.Model.Enumerations.JoinType.Left;
    prodJoin1.SetCondition("Sample_Product.Category = Sample_ProductCategory.Id");

    var prodJoin2 = getProducts.AsDatabaseAggregate.CreateJoin();
    prodJoin2.LeftSource = prodSrc; prodJoin2.RightSource = prodImgSrc;
    prodJoin2.JoinType = OutSystems.Model.Enumerations.JoinType.Left;
    prodJoin2.SetCondition("Sample_Product.Id = Sample_ProductMainImage.ProductId");

    // Four filters — chained AND.
    getProducts.AsDatabaseAggregate.CreateFilter(
        "ProductCategory = NullIdentifier() or Sample_Product.Category = ProductCategory ");
    getProducts.AsDatabaseAggregate.CreateFilter("MinPriceSelected <= Sample_Product.Price");
    getProducts.AsDatabaseAggregate.CreateFilter("Sample_Product.Price <= MaxPriceSelected");
    getProducts.AsDatabaseAggregate.CreateFilter(
        "SearchKeyword = \"\" or Sample_Product.Name like \"%\" + SearchKeyword + \"%\" "
        + "or Sample_Product.Description like \"%\" + SearchKeyword + \"%\"");

    getProducts.AsDatabaseAggregate.CreateSort().SetAttribute("Sample_Product.Name");

    // 4) Local variables for filter state.
    var searchKeyword = screen.CreateLocalVariable("SearchKeyword");
    searchKeyword.DataType = app.TextType;

    var productCategory = screen.CreateLocalVariable("ProductCategory");
    productCategory.DataType = productCategoryEntity.IdentifierType;

    var minPrice = screen.CreateLocalVariable("MinPriceSelected");
    minPrice.DataType = app.CurrencyType;
    minPrice.SetDefaultValue("0");

    var maxPrice = screen.CreateLocalVariable("MaxPriceSelected");
    maxPrice.DataType = app.CurrencyType;
    maxPrice.SetDefaultValue("1600");

    var maxRecords = screen.CreateLocalVariable("MaxRecords");
    maxRecords.DataType = app.IntegerType;
    maxRecords.SetDefaultValue("12");

    var startIndex = screen.CreateLocalVariable("StartIndex");
    startIndex.DataType = app.IntegerType;

    // 5) PaginationOnNavigate action — Assign StartIndex, RefreshData.
    var paginationAction = screen.CreateScreenAction("PaginationOnNavigate");
    var newStartIndex = paginationAction.CreateInputParameter("NewStartIndex");
    newStartIndex.DataType = app.IntegerType;
    newStartIndex.IsMandatory = true;

    var paStart = paginationAction.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
    var paAssign = paginationAction.CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>();
    paAssign.CreateAssignment("StartIndex", "NewStartIndex");
    paStart.Target = paAssign;
    var paRefresh = paginationAction.CreateNode<OutSystems.Model.Logic.Nodes.IRefreshDataNode>().ConnectedBelow(paAssign, 1140);
    paRefresh.DataSource = getProducts;
    paRefresh.SetMaxRecords("MaxRecords");
    paRefresh.SetStartIndex("StartIndex");
    var paEnd = paginationAction.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>();
    paRefresh.Target = paEnd;

    // 6) RefreshTable action — the filter/reset orchestrator. 6 inputs, two If branches.
    var refreshTable = screen.CreateScreenAction("RefreshTable");
    var rtResetFilters = refreshTable.CreateInputParameter("ResetFilters"); rtResetFilters.DataType = app.BooleanType; rtResetFilters.IsMandatory = true;
    var rtResetPagination = refreshTable.CreateInputParameter("ResetPagination"); rtResetPagination.DataType = app.BooleanType; rtResetPagination.IsMandatory = true;
    var rtCategory = refreshTable.CreateInputParameter("Category"); rtCategory.DataType = productCategoryEntity.IdentifierType; rtCategory.IsMandatory = true;
    var rtMinValue = refreshTable.CreateInputParameter("MinValue"); rtMinValue.DataType = app.CurrencyType; rtMinValue.IsMandatory = true;
    var rtMaxValue = refreshTable.CreateInputParameter("MaxValue"); rtMaxValue.DataType = app.CurrencyType; rtMaxValue.IsMandatory = true;
    var rtNewStart = refreshTable.CreateInputParameter("NewStartIndex"); rtNewStart.DataType = app.IntegerType; rtNewStart.IsMandatory = true;

    // Function-local variables for the reset defaults (mirrors the OML).
    var rtMinV2 = refreshTable.CreateLocalVariable("minValue2"); rtMinV2.DataType = app.IntegerType; rtMinV2.SetDefaultValue("0");
    var rtMaxV2 = refreshTable.CreateLocalVariable("maxValue2"); rtMaxV2.DataType = app.IntegerType; rtMaxV2.SetDefaultValue("1600");

    var rtStart = refreshTable.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
    var rtAssignInputs = refreshTable.CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>();
    rtAssignInputs.CreateAssignment("ProductCategory", "Category");
    rtAssignInputs.CreateAssignment("MinPriceSelected", "MinValue");
    rtAssignInputs.CreateAssignment("MaxPriceSelected", "MaxValue");
    rtAssignInputs.CreateAssignment("StartIndex", "NewStartIndex");
    rtStart.Target = rtAssignInputs;

    var ifReset = refreshTable.CreateNode<OutSystems.Model.Logic.Nodes.IIfNode>().ConnectedBelow(rtAssignInputs, 1368);
    ifReset.SetCondition("ResetFilters");

    var ifResetPag = refreshTable.CreateNode<OutSystems.Model.Logic.Nodes.IIfNode>();
    ifResetPag.SetCondition("ResetPagination");
    ifReset.FalseTarget = ifResetPag;

    var rtAssignReset = refreshTable.CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>().ToTheRightOf(ifReset, 2052);
    rtAssignReset.Target = ifResetPag;
    rtAssignReset.CreateAssignment("SearchKeyword", "\"\"");
    rtAssignReset.CreateAssignment("Category", "NullIdentifier()");
    rtAssignReset.CreateAssignment("MinPriceSelected", "minValue2");
    rtAssignReset.CreateAssignment("MaxPriceSelected", "maxValue2");
    ifReset.TrueTarget = rtAssignReset;

    var rtRefresh = refreshTable.CreateNode<OutSystems.Model.Logic.Nodes.IRefreshDataNode>().Below(ifResetPag, 2052);
    rtRefresh.DataSource = getProducts;
    rtRefresh.SetMaxRecords("MaxRecords");
    rtRefresh.SetStartIndex("StartIndex");
    ifResetPag.FalseTarget = rtRefresh;

    var rtAssignStart0 = refreshTable.CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>().ToTheRightOf(ifResetPag, 2057);
    rtAssignStart0.Target = rtRefresh;
    rtAssignStart0.CreateAssignment("StartIndex", "0");
    ifResetPag.TrueTarget = rtAssignStart0;

    var rtEnd = refreshTable.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(rtRefresh, 1852);
}
```

## Building it (Model API) — UI

```csharp
// 7) LayoutTopMenu (see layouts.md). Header default content deleted, Menu added at the end.
var outSystemsUI = app.References.Named("OutSystemsUI");
var content = outSystemsUI.MobileFlows.Named("Content");
var adaptive = outSystemsUI.MobileFlows.Named("Adaptive");
var navigation = outSystemsUI.MobileFlows.Named("Navigation");
var interaction = outSystemsUI.MobileFlows.Named("Interaction");

var layoutTopMenuBlock = app.MobileFlows.Named("Layouts").Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlock>().Named("LayoutTopMenu");
var menuBlock = app.MobileFlows.Named("Common").Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlock>().Named("Menu");

var layout = screen.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
layout.SourceBlock = layoutTopMenuBlock;
var headerPh = layout.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Header");
headerPh.Widgets.ToList().ForEach(w => w.Delete());

// 8) Title → AdvancedHtml h1 "Product Overview".
var titlePh = layout.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Title");
var screenTitle = titlePh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IAdvancedHtml>("Screen_Title");
screenTitle.Tag = "h1";
var titleText = screenTitle.Content.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
titleText.Text = "Product Overview";

// 9) Actions → conditional Clear Filters link.
var actionsPh = layout.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Actions");
var clearIf = actionsPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IIfWidget>();
clearIf.SetCondition("ProductCategory <> NullIdentifier() or MinPriceSelected <> 0 or MaxPriceSelected <> 600");
var clearLink = clearIf.TrueBranch.CreateWidget<ServiceStudio.Plugin.NRWidgets.ILink>();
clearLink.SetStyle("\"font-size-s\"");
var clearText = (OutSystems.Model.UI.Mobile.Widgets.ITextWidget)clearLink.Widgets.First();
clearText.Text = "Clear Filters";
clearLink.OnClick.Destination = refreshTable;
clearLink.OnClick.SetArgumentValue(rtResetFilters, "True");
clearLink.OnClick.SetArgumentValue(rtResetPagination, "True");
clearLink.OnClick.SetArgumentValue(rtCategory, "NullIdentifier()");
clearLink.OnClick.SetArgumentValue(rtMinValue, "MinPriceSelected");
clearLink.OnClick.SetArgumentValue(rtMaxValue, "MaxPriceSelected");
clearLink.OnClick.SetArgumentValue(rtNewStart, "StartIndex");

// 10) MainContent → category Tag list, then Gallery, then Pagination.
var mainPh = layout.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "MainContent");

// 10a) Category list — horizontal flex, one Tag per category.
var catList = mainPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IList>();
catList.SetSource("GetProductCategories.List");
catList.SetStyle("\"list list-group display-flex column-gap-base\"");

var catContainer = catList.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
var catLink = catContainer.CreateWidget<ServiceStudio.Plugin.NRWidgets.ILink>();
catLink.Widgets.ToList().ForEach(w => w.Delete()); // we'll add a Tag, not a TextWidget
catLink.SetStyle("If(GetProductCategories.List.Current.Category = ProductCategory, \"text-primary font-semi-bold\", \"text-neutral-7\")");
catLink.Width = "(fill parent)";

var tagSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Tag");
var tagInst = catLink.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
tagInst.SourceBlock = tagSig;
tagInst.SetArgumentValue(tagSig.InputParameters.Named("Color"),
    "If(GetProductCategories.List.Current.Category = ProductCategory, Entities.Color.Primary, Entities.Color.Neutral7)");
tagInst.SetArgumentValue(tagSig.InputParameters.Named("IsLight"),
    "GetProductCategories.List.Current.Category <> ProductCategory");
// Shape / Size / ExtendedClass left at defaults.

var tagPh = tagInst.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Tag");
var tagExpr = tagPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IExpression>();
tagExpr.SetValue("GetProductCategories.List.Current.CategoryName");

catLink.OnClick.Destination = refreshTable;
catLink.OnClick.SetArgumentValue(rtCategory, "GetProductCategories.List.Current.Category");
catLink.OnClick.SetArgumentValue(rtResetFilters, "False");
catLink.OnClick.SetArgumentValue(rtResetPagination, "True");
catLink.OnClick.SetArgumentValue(rtMinValue, "MinPriceSelected");
catLink.OnClick.SetArgumentValue(rtMaxValue, "MaxPriceSelected");
catLink.OnClick.SetArgumentValue(rtNewStart, "StartIndex");

// 10b) Gallery block.
var gallerySig = adaptive.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Gallery");
var gallery = mainPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
gallery.SourceBlock = gallerySig;
var galleryContentPh = gallery.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");
galleryContentPh.Widgets.ToList().ForEach(w => w.Delete()); // CRITICAL: clear default content
gallery.SetArgumentValue(gallerySig.InputParameters.Named("RowItemsDesktop"), "4");
gallery.SetArgumentValue(gallerySig.InputParameters.Named("RowItemsTablet"), "2");
gallery.SetArgumentValue(gallerySig.InputParameters.Named("RowItemsPhone"), "1");
gallery.SetArgumentValue(gallerySig.InputParameters.Named("ExtendedClass"), "\"margin-top-m\"");

// Inside Gallery.Content: a List over the products aggregate.
var prodList = galleryContentPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IList>("ListOfProducts3");
prodList.AnimateItems = false; // we'll handle animation per-row via the Animate block
prodList.SetSource("GetProductsByCategory.List");
prodList.SetStyle("\"list list-group\"");
var virtExt = prodList.CreateExtendedProperty();
virtExt.Property = "disable-virtualization";
virtExt.SetValue("True");

// Per-row: Animate (FadeIn, staggered) → CardSectioned with image + name + price.
var animateSig = interaction.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Animate");
var animateInst = prodList.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
animateInst.SourceBlock = animateSig;
animateInst.SetArgumentValue(animateSig.InputParameters.Named("AnimationType"), "Entities.AnimationType.FadeIn");
animateInst.SetArgumentValue(animateSig.InputParameters.Named("Delay"), "GetProductsByCategory.List.CurrentRowNumber * 100");

var animateContentPh = animateInst.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");

var cardSectionedSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("CardSectioned");
var card = animateContentPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
card.SourceBlock = cardSectionedSig;
card.SetArgumentValue(cardSectionedSig.InputParameters.Named("ImagePadding"), "False");
card.SetArgumentValue(cardSectionedSig.InputParameters.Named("ExtendedClass"), "\"align-center\"");

// Image placeholder.
var imgPh = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Image");
var img = imgPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IImage>();
img.Type = ServiceStudio.Plugin.NRWidgets.Enumerations.Type.Binary;
img.SetImageContent("GetProductsByCategory.List.Current.Sample_ProductMainImage.File");
img.DefaultImage = app.Images.Named("Request"); // fallback static image
var altExt = img.CreateExtendedProperty();
altExt.Property = "alt";
altExt.SetValue("\"\"");

// Title placeholder — centered Expression with heading6 typography.
var titlePh2 = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Title");
var titleWrap = titlePh2.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
titleWrap.CustomStyle = "text-align: center;";
var nameExpr = titleWrap.CreateWidget<ServiceStudio.Plugin.NRWidgets.IExpression>();
nameExpr.SetStyle("\"heading6\"");
nameExpr.SetValue("GetProductsByCategory.List.Current.Sample_Product.Name");

// Content placeholder — centered Expression with FormatCurrency.
var contentPh2 = card.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");
var priceWrap = contentPh2.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
priceWrap.CustomStyle = "text-align: center;";
var priceExpr = priceWrap.CreateWidget<ServiceStudio.Plugin.NRWidgets.IExpression>();
priceExpr.SetStyle("\"heading4\"");
priceExpr.SetValue("FormatCurrency(GetProductsByCategory.List.Current.Sample_Product.Price, \"$\", 2, \".\", \",\")");

// 10c) Pagination block — custom Phosphor caret-left/right icons.
var paginationSig = navigation.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Pagination");
var pagination = mainPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
pagination.SourceBlock = paginationSig;
var prevPh = pagination.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Previous");
prevPh.Widgets.ToList().ForEach(w => w.Delete());
var nextPh = pagination.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Next");
nextPh.Widgets.ToList().ForEach(w => w.Delete());

pagination.SetArgumentValue(paginationSig.InputParameters.Named("MaxRecords"), "MaxRecords");
pagination.SetArgumentValue(paginationSig.InputParameters.Named("TotalCount"), "GetProductsByCategory.Count");
pagination.SetArgumentValue(paginationSig.InputParameters.Named("StartIndex"), "StartIndex");

var onNavigateHandler = pagination.EventHandlers.FirstOrDefault(e => e.Event.Name == "OnNavigate");
onNavigateHandler.Handler = paginationAction;
onNavigateHandler.SetArgumentValue(newStartIndex, "NewStartIndex");

var prevIcon = prevPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
prevIcon.Icon = "caret-left";
prevIcon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
prevIcon.Weight = "fill";

var nextIcon = nextPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
nextIcon.Icon = "caret-right";
nextIcon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
nextIcon.Weight = "fill";

// ──────────────────────────────────────────────────────────────────────────
// Recoloring / reshaping the prev/next BUTTONS themselves (not just the icon)
// ──────────────────────────────────────────────────────────────────────────
// The Previous/Next placeholders above ONLY swap the icon glyph. The icon
// lives INSIDE the block's own `.pagination-button` element — a wrapper
// Container with ExtendedClass cannot recolor the button.
//
// If the design has a custom button shape / background / border (e.g. 36×36
// circles, brand-color next button, neutral prev button) AND/OR hides the
// "page X of Y" input + counter, add CSS rules to the THEME's StyleSheet
// targeting `.pagination-button`, `.pagination-input`, `.pagination-counter`.
// `Pagination.ShowGoToPage = True` + hide-via-CSS is more predictable than
// `False` (the elements render and can be cleanly hidden).
//
// Example CSS (apply via theme.StyleSheet, NOT via ExtendedClass on a wrapper):
//
//   .pagination-input,
//   .pagination-counter { display: none; }
//
//   .pagination-button {
//     width: 36px; height: 36px; border-radius: 18px; border: none;
//     background: var(--color-neutral-2);
//     color: var(--color-text-secondary);
//   }
//   .pagination-button:last-of-type {
//     background: var(--color-primary);
//     color: var(--color-text-primary);
//   }
//
// See `patterns/navigation.md#styling-the-buttons-icon-only-prevnext-custom-colors-hidden-inputcounter`
// for the full reference + spec-side `theme_extensions.classes[]` pattern.

pagination.SetArgumentValue(paginationSig.InputParameters.Named("ShowGoToPage"), "True");

// 11) Header → Menu block (added LAST since we needed `headerPh` defined earlier).
var menu = headerPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
menu.SourceBlock = menuBlock;
```

## Decision points

| Decision | Default | Override when |
|---|---|---|
| **Filter inputs** | Search keyword + category + price range — three inputs covering the most common e-commerce / catalog filter set | Add status filter, brand filter, rating filter, etc. — one filter clause + one local var + one input parameter on `RefreshTable` per addition. |
| **`Gallery` row counts** | `4 / 2 / 1` (desktop / tablet / phone) for product-card-shaped content | Tighter cards → `5/3/1` or `6/3/2`; chunkier content (job listings, real-estate cards) → `3/2/1` or `2/2/1`. |
| **`MaxRecords` per page** | `12` (3 rows of 4 on desktop) | Make it match the product / row size: 12 for 4-up grids, 9 for 3-up, 8 for 2-up. |
| **`Animate` AnimationType** | `FadeIn` with `Delay = .CurrentRowNumber * 100` (per-row stagger, ~100ms apart) | `SlideIn` for narrative emphasis; reduce `Delay` to `* 50` for snappier feel; remove animate entirely for >50-row results (compounds slowly). |
| **`Pagination` icons** | `caret-left` / `caret-right` (Phosphor, weight=fill) | Compact: `arrow-left`/`arrow-right`. Avoid emoji or glyph chars — use `IIcon` always. |
| **Reset behavior** | "Clear Filters" resets ALL filters AND pagination, "click a category Tag" resets pagination only | Match what the design specifies; the `RefreshTable(ResetFilters, ResetPagination, …)` signature lets you mix-and-match. |
| **`disable-virtualization` extended property on the inner List** | `True` (recommended for grids — virtualization conflicts with Gallery's grid layout) | Leave default if the data set is huge AND you've validated Gallery's virtualization handles it. |

## Common pitfalls

❌ **Forgetting to clear `Gallery.Content` default content** before adding the inner List. The Gallery block ships with placeholder default widgets that compound with the real content.
```csharp
galleryContentPh.Widgets.ToList().ForEach(w => w.Delete()); // ALWAYS do this first
```

❌ **Forgetting to clear `Pagination.Previous` / `Pagination.Next` defaults** before adding the custom Phosphor icons. Same pattern — the default content stacks under your icon.

❌ **Putting filters in the URL / route instead of local variables.** OS UI's pattern is local-var-driven; `RefreshData` reads them. URL-driven filtering is possible (via `OnInitialize` parsing a query string) but it's not the default. Stick with local vars for v1.

❌ **Building a `RefreshTable` without the `ResetFilters` / `ResetPagination` switch parameters.** The single-action-with-flags pattern lets you wire one action to "Clear Filters", "click a Tag", "change a price slider", and "search" — each passing different flag combinations. Without the flags you end up with 3-4 near-duplicate actions.

❌ **Putting the `Animate` block at the screen level instead of per-row inside the `List`.** The point of `.CurrentRowNumber * 100` is staggering — animate fires for each row independently. A single screen-level Animate animates the whole gallery as one block, losing the cascade effect.

❌ **Hard-coding the price-range bounds** (`0` and `1600` literally) in the filter clauses. Use local variables (`MinPriceSelected`, `MaxPriceSelected`) so a `RangeSlider` widget (not in this recipe but trivial to add) can drive the values.

❌ **Pagination icons via emoji or HTML entities** (`◀️ ▶️` or `&laquo; &raquo;`). The recipe uses real `IIcon` widgets with Phosphor names — theme-aware, accessible, and consistent with the rest of the screen.

❌ **Wrapping the prev/next icon in a Container with classes like `arrow-prev` / `arrow-next` and expecting that to recolor the button chrome.** The Previous/Next placeholders sit INSIDE the block's own `.pagination-button` element — your wrapper Container can't reach the button. To restyle the buttons themselves (background, border-radius, size, per-side color), add CSS rules to the theme's StyleSheet targeting `.pagination-button` (and `.pagination-button:last-of-type` for the next button). To hide the page-number input + counter that ship with the block, hide `.pagination-input` and `.pagination-counter`. Keep `ShowGoToPage = True` so those elements render and CSS can hide them predictably. See [`patterns/navigation.md#styling-the-buttons-icon-only-prevnext-custom-colors-hidden-inputcounter`](../patterns/navigation.md#styling-the-buttons-icon-only-prevnext-custom-colors-hidden-inputcounter).

❌ **Wiring `OnNavigate` directly to `RefreshTable`** instead of through `PaginationOnNavigate`. The pagination action is a thin wrapper that does ONE thing — assign StartIndex and refresh — without touching filter state. Routing through the heavier `RefreshTable` (which has 6 inputs and reset branching) means every page click has to pass all the filter values redundantly.

❌ **Putting the conditional `Clear Filters` link directly in MainContent** instead of `LayoutTopMenu.Actions`. The `Actions` placeholder is the canonical home for screen-level affordances; putting the link in MainContent floats it next to the gallery and makes it look like a card affordance instead of a screen action.

❌ **Image without `alt`.** Set `alt=""` (empty string, not omitted) for decorative product thumbnails — the product name nearby supplies the meaning. For genuinely informational images, set `alt` to a description.

## Related

- [`recipes/columns-and-cards-dashboard.md`](columns-and-cards-dashboard.md) — sibling screen-level recipe for dashboards.
- [`recipes/paginated-list-with-filters.md`](paginated-list-with-filters.md) — a similar pattern but for a tabular list (columns of metadata) instead of a visual gallery (image-led grid).
- [`patterns/adaptive.md`](../patterns/adaptive.md) — `Gallery` arg reference (`RowItemsDesktop`, `RowItemsTablet`, `RowItemsPhone`, `ItemsGap`).
- [`patterns/navigation.md`](../patterns/navigation.md) — `Pagination` arg reference and event handlers.
- [`patterns/interaction.md`](../patterns/interaction.md) — `Animate` block options (AnimationType / Speed / Delay).
