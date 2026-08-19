---
name: osui-recipe-tab-switcher
description: How to build a tabbed view-switcher using the Tabs / TabsHeaderItem / TabsContentItem blocks. Use when the request mentions tabs, a tab switcher, segmented control, "switch between [view A] and [view B]," "All / Active / Archived" filter strips, etc.
---

# Recipe — Tab Switcher

> **Goal:** the canonical OutSystems UI tabbed switcher between 2–6 sibling content panels — **never** a hand-rolled toggle of `Container`s with custom click handlers.

## When to use this recipe

Trigger phrases:

- "tabs", "tab switcher", "tabbed view", "segmented control"
- "All / Interest", "All / Active / Archived" — any small finite set of view modes **with their own content panels**
- "switch between [X] and [Y]" — where X and Y are distinct content regions
- Vertical sidebar of tab-like buttons (`Tabs.TabsOrientation = Vertical`)

## STOP — is this actually `Tabs`, or is it filter pills?

> ⚠️ **The most common misfire of this recipe is using `Tabs` when the design has no content-panel swap.** Pill-shaped toggles that look like tabs but only **filter data in a separate region** (or are purely visual) are **NOT tabs** — they're filter pills / segmented filters, and they should be `IButton` widgets with active/inactive `ExtendedClass`, not a `Tabs` block.
>
> `Tabs` produces a Header strip AND a Content panel beneath it. If you only need the Header strip, you don't need `Tabs`.

Decide with this question: **"When the user selects a different option, does a content panel directly underneath the pills get swapped out?"**

| Answer | Pattern | Why |
|---|---|---|
| **Yes** — there's a distinct content region per option, and selecting an option replaces what's directly below the header strip | `Tabs` + `TabsHeaderItem` + `TabsContentItem` | The block exists exactly for this case — Header + Content panel pairs with built-in active-state, animation, ARIA. |
| **No, it filters data shown elsewhere** — e.g. the pills sit above a row of cards / a list / a chart, and selecting a pill changes the aggregate filter that drives that region | Two `IButton` widgets in a `display-flex column-gap-s` Container, with `ExtendedClass="tab-pill-active"` / `"tab-pill-inactive"` (define both classes on the theme), bound to a `LocalVariable` that the filtered aggregate reads | A `Tabs` block here produces a phantom empty Content placeholder underneath, which the renderer surfaces as a giant empty box ("Click to add Content"). The pills don't own a content panel — they just toggle a filter. |
| **No, it's purely visual** — the design shows two pills with no functional difference between them (mockup-only state) | Same as above — two `IButton` widgets with active/inactive `ExtendedClass`. Wire `OnClick` to a no-op or set a `LocalVariable` for future use | Same reason. Don't materialize an empty Content panel just to render two pills. |

**Tell-tale signs you have filter pills, not tabs:**

- The "tabs" sit in a row that ALSO contains pagination arrows / search / sort controls on the right (Figma frame named `"Tabs Row"` or `"Filter Row"` with the pills + other controls as siblings — the pills don't own the region below them).
- The region directly below the pills is **shared** across pill states — same cards, same list, same chart, just with a different filter applied.
- The design has no second-tab content drawn anywhere — the designer only mocked the "All" state because the other state is the same view with a filter.
- The pill row is short (2 pills, sometimes 3) and visually styled as standalone rounded buttons rather than with a connected underline / active-tab indicator that visually attaches to a panel.

If any of these apply, **use two `IButton`s, not `Tabs`.**

### Recipe — filter pills (the non-Tabs path)

```csharp
// Inside the section wrapper that ALSO holds the other row controls
// (pagination arrows, search, etc.), as a single sibling Container.
var pillsRow = sectionWrapper.CreateWidget<IContainer>();
pillsRow.SetStyle("\"display-flex column-gap-s align-items-center\"");

var allBtn = pillsRow.CreateWidget<IButton>("FilterAll");
allBtn.SetStyle("\"tab-pill tab-pill-active\"");
allBtn.Widgets.OfType<ITextWidget>().First().Value = "\"All\"";
// Wire OnClick to a ScreenAction that sets the active-filter LocalVariable

var interestBtn = pillsRow.CreateWidget<IButton>("FilterInterest");
interestBtn.SetStyle("\"tab-pill tab-pill-inactive\"");
interestBtn.Widgets.OfType<ITextWidget>().First().Value = "\"Interest\"";
// Wire OnClick to a ScreenAction that sets the active-filter LocalVariable
```

Theme StyleSheet (theme `:root` scope — see [`../styles-and-utilities.md#theming-the-app`](../styles-and-utilities.md#theming-the-app-dark-mode-full-rebrand-palette-swap)):

```css
.tab-pill           { padding: 8px 16px; border-radius: 20px;
                      font-family: var(--font-family-body); font-size: 14px;
                      line-height: 1; cursor: pointer; }
.tab-pill-active    { background: var(--color-neutral-10); color: var(--color-neutral-0);
                      font-weight: 600; border: none; }
.tab-pill-inactive  { background: var(--color-neutral-0); color: var(--color-neutral-10);
                      font-weight: 400; border: 1px solid var(--color-neutral-3); }
```

For dynamic active-state (re-render which pill is active based on a `LocalVariable`), drive `ExtendedClass` via an expression:

```csharp
allBtn.SetStyle("\"tab-pill \" + If(ActiveFilter = \"All\", \"tab-pill-active\", \"tab-pill-inactive\")");
```

Use `Tabs` for the panel-swap case; use this filter-pills pattern for everything else. Don't build a custom `<Container>` toggle in either case.

## What you'll build

```
Tabs (block instance — from OutSystemsUI/Navigation)
  Tabs.StartingTab     = 0
  Tabs.TabsOrientation = Entities.Orientation.Horizontal   (Vertical for sidebar tabs)
  Tabs.OptionalConfigs = { JustifyHeaders: True }          (stretch headers across width)
  ├── Tabs.Header  (placeholder)
  │     ├── TabsHeaderItem (block instance) ← one per tab, IN ORDER
  │     │     └── TabsHeaderItem.Title       ← the tab label (Text / AdvancedHtml)  ⚠️ "Title", not "Content"
  │     └── …
  └── Tabs.Content (placeholder)
        ├── TabsContentItem (block instance) ← SAME order as headers
        │     └── TabsContentItem.Content     ← the panel body
        └── …
```

> **Critical:** `TabsContentItem`s must be in the **same order** as `TabsHeaderItem`s. Order = position-based binding. Out-of-order items render the wrong content under the wrong header.

## Required references

All three blocks live in **`OutSystemsUI/Navigation`**. Look them up via the canonical pattern in [`../blocks-index.md#how-to-look-up-an-os-ui-block-the-lookup-pattern`](../blocks-index.md#how-to-look-up-an-os-ui-block-the-lookup-pattern).

| Block | OutSystemsUI flow | Key args | Key placeholders |
|---|---|---|---|
| `Tabs` | `Navigation` | `Tabs.StartingTab`, `Tabs.TabsOrientation`, `Tabs.OptionalConfigs`, `Tabs.Height` | `Tabs.Header`, `Tabs.Content` |
| `TabsHeaderItem` | `Navigation` | (none typically) | **`TabsHeaderItem.Title`** (NOT `Content`) |
| `TabsContentItem` | `Navigation` | (none typically) | `TabsContentItem.Content` |

For full block API see [`../patterns/navigation.md#tabs--tabsheaderitem--tabscontentitem`](../patterns/navigation.md#tabs--tabsheaderitem--tabscontentitem).

## C# template

```csharp
// 1) Look up block signatures from OutSystemsUI/Navigation
var app          = eSpace.GetESpace();
var outSystemsUI = app.References.Named("OutSystemsUI");
var navFlow      = outSystemsUI.MobileFlows.Named("Navigation");

var tabsSig            = navFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "Tabs");
var tabsHeaderItemSig  = navFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "TabsHeaderItem");
var tabsContentItemSig = navFlow.Nodes.OfType<IMobileBlockSignature>()
    .FirstOrDefault(n => (n as IModelObject)?.DisplayName == "TabsContentItem");

// 2) Instantiate Tabs and set arguments
// SetArgumentValue takes (IInputParameterSignature, ExpressionDefinition).
// Look up the parameter by BARE name on inst.SourceBlock.InputParameters.Named("…").
// Pass the value as a string — it implicitly converts to ExpressionDefinition.
var tabs = parentContainer.CreateWidget<IMobileBlockInstanceWidget>("AccountTabs");
tabs.SourceBlock = tabsSig;
tabs.SetArgumentValue(tabs.SourceBlock.InputParameters.Named("StartingTab"),      "0");
tabs.SetArgumentValue(tabs.SourceBlock.InputParameters.Named("TabsOrientation"),  "Entities.Orientation.Horizontal");
tabs.SetArgumentValue(tabs.SourceBlock.InputParameters.Named("OptionalConfigs"),  "OptionalConfigsTabs{ JustifyHeaders: True }");

// Runtime PlaceholdersContent uses BARE names (not "Tabs.Header"). See blocks-index.md.
var headerPh  = tabs.PlaceholdersContent
    .FirstOrDefault(p => p.Placeholder == "Header");
var contentPh = tabs.PlaceholdersContent
    .FirstOrDefault(p => p.Placeholder == "Content");

// ⚠️ Tabs ships with 3 default TabsHeaderItem + TabsContentItem pairs auto-created
//    inside its Header / Content placeholders. DELETE them before adding your own,
//    otherwise you'll see 3 empty placeholder tabs in front of yours.
headerPh.Widgets.OfType<IMobileBlockInstanceWidget>().ToList().ForEach(x => x.Delete());
contentPh.Widgets.OfType<IMobileBlockInstanceWidget>().ToList().ForEach(x => x.Delete());

// 3) Add a HeaderItem + ContentItem pair per tab — IN THE SAME ORDER.
var labels = new[] { "All", "Interest" };
foreach (var label in labels)
{
    // Header (label goes in TabsHeaderItem.Title, NOT .Content)
    var hdr = headerPh.CreateWidget<IMobileBlockInstanceWidget>($"Hdr_{label}");
    hdr.SourceBlock = tabsHeaderItemSig;
    var titlePh = hdr.PlaceholdersContent
        .FirstOrDefault(p => p.Placeholder == "Title");  // BARE name (NOT "TabsHeaderItem.Title")
    var lbl = titlePh.CreateWidget<IText>($"Lbl_{label}");
    lbl.Value = $"\"{label}\"";

    // Content panel
    var body = contentPh.CreateWidget<IMobileBlockInstanceWidget>($"Body_{label}");
    body.SourceBlock = tabsContentItemSig;
    var bodyContent = body.PlaceholdersContent
        .FirstOrDefault(p => p.Placeholder == "Content");  // BARE name
    // … populate bodyContent with the panel-specific widgets …
}
```

> **Block-argument note:** `SetArgumentValue` is an extension with signature `(IInputParameterSignature, ExpressionDefinition)`. Look up the parameter by **bare name** on `inst.SourceBlock.InputParameters.Named("…")`. Strings implicitly convert to `ExpressionDefinition`. See [`../blocks-index.md`](../blocks-index.md) for the canonical pattern.

## Anti-patterns to AVOID

❌ **Forgetting to delete the 3 default TabsHeaderItem / TabsContentItem pairs.** Tabs ships with 3 of each pre-populated. If you only add 2 tabs without clearing the defaults, the rendered screen shows 5 tabs — the first 3 empty placeholders ("Use this placeholder to…") followed by your 2 real ones.

❌ Two `Container`s side-by-side, each acting as a "tab," with a custom click handler toggling visibility via a LocalVariable. The Tabs block already encapsulates the entire active-state, animation, accessibility, and keyboard-navigation behavior. Don't reimplement it.

❌ Using `Tabs` but **mismatching header / content ordering**. Always emit them as parallel arrays in the same loop iteration.

❌ Placing the panel content **directly inside `Tabs.Content`** (without a `TabsContentItem` wrapper per panel). It collapses to one panel.

❌ Leaving `Tabs.OptionalConfigs` empty when the design clearly stretches headers full-width. Set `{ JustifyHeaders: True }`.

❌ **Using `Tabs` for filter pills that have no content panel underneath them.** If the pills sit above a row of cards / a list / a chart and selecting a pill only changes the aggregate filter feeding that region, you do NOT have tabs — you have filter pills. `Tabs` here materializes an empty Content placeholder that renders as a giant "Click to add Content" empty box beneath the pill row. See [`STOP — is this actually Tabs, or is it filter pills?`](#stop--is-this-actually-tabs-or-is-it-filter-pills) above — use two `IButton`s with active/inactive `ExtendedClass` instead.

## Related

- For a vertical "sidebar of tabs" (e.g. left-rail navigation inside a settings page), set `Tabs.TabsOrientation = Vertical` and `Tabs.TabsVerticalPosition = Left | Right`.
- For a navigation pattern that **changes the URL** (vs. local state), use a sidebar `Menu` with screen-level routes instead.
- For a wizard / multi-step flow with progress, use `Wizard` ([`../patterns/navigation.md#wizard`](../patterns/navigation.md#wizard)).
