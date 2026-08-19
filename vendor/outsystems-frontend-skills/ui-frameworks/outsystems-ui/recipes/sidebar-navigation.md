---
name: osui-recipe-sidebar-navigation
description: How to wire the persistent sidebar of a Reactive Web app — the LayoutSideMenu layout's Navigation placeholder consuming the existing app Menu block. Use when the request mentions "sidebar", "left navigation", "nav rail with home / cards / recipients / settings."
---

# Recipe — Sidebar Navigation

> **Goal:** a persistent left-side navigation rail that's consistent across screens. The OutSystems UI canonical shape is `LayoutSideMenu` (the layout block) whose `Navigation` placeholder hosts the **already-existing `Menu` block from the app's `Common` flow** — **never** a hand-built `Container` of nav items.

> **NOT this recipe**: if you want a *transient* slide-out drawer (filter panel, cart, settings, off-canvas mobile menu — opens on a button click, closes via X) — that's the `Sidebar` block from `OutSystemsUI/Interaction`, a completely different thing. See [`sidebar-drawer.md`](sidebar-drawer.md).

## When to use this recipe

Trigger phrases:

- "left sidebar with nav items"
- "side navigation panel", "side menu", "left rail"
- "navigation: Home, Cards, Recipients, Manage"
- Any layout description where the chrome stays put and only the main area changes between screens

## What you'll build

```
Screen
  └── LayoutSideMenu (block instance)
        ├── LayoutSideMenu.Navigation (placeholder)
        │     └── Menu (block instance from Common flow)  ← ALWAYS use Menu here
        │           └── Menu.PageLinks (placeholder / container)
        │                 ├── Link (widget) — "Home"      → OnClick.Destination = HomeScreen
        │                 ├── Link (widget) — "Cards"     → OnClick.Destination = CardsScreen
        │                 ├── Link (widget) — "Recipients"→ OnClick.Destination = RecipientsScreen
        │                 └── Link (widget) — "Manage"    → OnClick.Destination = ManageScreen
        ├── LayoutSideMenu.Header
        ├── LayoutSideMenu.Title
        ├── LayoutSideMenu.Actions
        ├── LayoutSideMenu.MainContent  ← the screen body
        └── LayoutSideMenu.Footer
```

### The non-negotiable rule

Whatever goes in `LayoutSideMenu.Navigation` (sidebar) or `LayoutTopMenu.Header` (top menu) is a **`Menu` block instance** — never `Container`, never raw `Link`s, never an `AdvancedHtml Tag="nav"`. The `Menu` block owns:

- The active-state styling for the current page.
- Mobile drawer behavior (collapse to hamburger on narrow viewports).
- ARIA roles (`role="navigation"`).
- Theme-coordinated spacing, typography, and hover states.

Inside `Menu.PageLinks` you put **`Link` widgets** — one per nav entry. Each `Link` has an `OnClick` with `Destination` pointing to the target screen.

The `Menu` block is normally **already defined in the app's `Common` flow** (it's part of the OutSystems UI app templates). Reuse it; don't recreate.

## Required references

| Block | Where it lives | Lookup |
|---|---|---|
| `LayoutSideMenu` | **App's** `Layouts` flow (local — not in OutSystemsUI library) | `app.MobileFlows.Named("Layouts").Nodes.OfType<IMobileBlock>().Named("LayoutSideMenu")` |
| `Menu` | **App's** `Common` flow (already there in standard apps) | `app.MobileFlows.Named("Common").Nodes.OfType<IMobileBlock>().Named("Menu")` |

> The `Menu` block exposes a **`Menu.PageLinks`** placeholder where each nav entry lives as a plain `ILink` widget. `Link` widgets ARE the canonical nav entry — not `MenuItem`, not `Container`. Wire each Link's `OnClick.Destination` to the target screen.

> The Layouts and Menu blocks are **local to the app** (in the standard OutSystems UI app templates), not in the OutSystemsUI library. Use `app.MobileFlows.Named(...)`, NOT `app.References.Named("OutSystemsUI")`.

For exact LayoutSideMenu placeholder names on your specific app template, call `get_web_block_details(web_block_name: "LayoutSideMenu")` — placeholder names are usually `Navigation`, `Header`, `Breadcrumbs`, `Title`, `Actions`, `MainContent`, `Footer` but can vary.

## C# template

```csharp
// 1) Locate existing local blocks (Layouts + Common are NOT under OutSystemsUI; they're in the app)
var app       = eSpace.GetESpace();
var layouts   = app.MobileFlows.Named("Layouts");
var common    = app.MobileFlows.Named("Common");
var layoutSideMenu = layouts.Nodes.OfType<IMobileBlock>().Named("LayoutSideMenu");
var menu           = common.Nodes.OfType<IMobileBlock>().Named("Menu");

// 2) Wrap the screen in LayoutSideMenu
var layoutInstance = screen.CreateWidget<IMobileBlockInstanceWidget>("Layout");
layoutInstance.SourceBlock = layoutSideMenu;

// 3) Slot the Menu block into the Navigation placeholder
//    (qualified placeholder name = "LayoutSideMenu.Navigation")
// Runtime PlaceholdersContent uses BARE names (not "LayoutSideMenu.Navigation"). See blocks-index.md.
var navPh = layoutInstance.PlaceholdersContent
    .FirstOrDefault(p => p.Placeholder == "Navigation");

var menuInst = navPh.CreateWidget<IMobileBlockInstanceWidget>("AppMenu");
menuInst.SourceBlock = menu;

// 4) Add nav entries as Link widgets inside Menu.PageLinks.
//    Each Link's OnClick.Destination points to the target screen.
//    Note: PageLinks is INSIDE the Menu block definition (in Common flow), so you find the
//    PageLinks Container by descending into Menu's widget tree, not via menuInst.PlaceholdersContent.
var pageLinksContainer = menu.GetAllDescendantsOfType<OutSystems.Model.UI.Mobile.Widgets.IContainer>()
    .FirstOrDefault(c => c.Name == "PageLinks");

foreach (var (label, destinationScreen) in navItems)
{
    var link = pageLinksContainer.CreateWidget<ILink>($"Nav_{label}");
    // Mutate the default ITextWidget child (don't Delete + recreate)
    var linkText = link.Widgets.OfType<ITextWidget>().First();
    linkText.Value = $"\"{label}\"";
    link.OnClick = new BuiltinEvent { Destination = destinationScreen };
    // (Optional) prepend an Icon widget for the leading nav icon
}

// 5) Slot the actual page content into MainContent
var mainPh = layoutInstance.PlaceholdersContent
    .FirstOrDefault(p => p.Placeholder == "MainContent");  // BARE name
// … populate mainPh with the page widgets …
```

> **Where PageLinks lives:** `PageLinks` is a `Container` widget **inside the Menu block's definition** (in `Common` flow), NOT a placeholder on the Menu instance. Descend into the Menu block's widget tree to find it (e.g. via `GetAllDescendantsOfType<IContainer>().FirstOrDefault(c => c.Name == "PageLinks")`). Once you have the container, you `CreateWidget<ILink>` directly on it. Each `Link` you add propagates to every screen that uses the Menu — that's the whole point of using a shared block.

> ⚠️ **DO NOT touch the PageLinks container's `Style`, `CustomStyle`, `SetStyle`, or `Width`.** PageLinks ships with theme-correct padding, item spacing, and active-state styling baked into the Menu block. Setting any styling on the container itself (or on a wrapping Container you add inside it) overrides those defaults and causes the visual bug where nav items render flush-left against the sidebar edge with no padding. **Just call `pageLinksContainer.CreateWidget<ILink>(…)` and stop there.** Style the individual `ILink` widgets if you need to (e.g. an icon prefix, hover variant), but never the container.

> ⚠️ **DO NOT wrap the Links in a styling Container inside PageLinks.** The pattern is `pageLinksContainer.CreateWidget<ILink>(...)` directly — every Link is a sibling of the others, with the parent container providing the layout. A `Container` wrapper between PageLinks and the Links resets the spacing the Menu block was supplying.

> **If `Menu` doesn't exist in `Common`** (e.g. a brand-new module), create it as a Web Block in `Common` with `Menu.PageLinks` exposed as a placeholder, then reference from every screen. Don't inline raw nav widgets in `LayoutSideMenu.Navigation` — `Menu` owns the nav semantics, active state, and mobile drawer behavior.

## Anti-patterns to AVOID

❌ **Putting raw `Link` widgets directly into `LayoutSideMenu.Navigation`** (skipping the `Menu` block wrapper). Links MUST go inside `Menu.PageLinks`. Without `Menu` you lose active-state styling, accessibility (`role="navigation"`), mobile drawer behavior, and theme integration.

❌ **Using a `Container` with class `"banking-sidebar"`** and stuffing nav items inside it. This is what `Menu` + `Link` (inside `Menu.PageLinks`) exist for. It also duplicates sidebar CSS across every screen's `StyleSheet`.

❌ **Reaching for `MenuItem` inside `Menu.PageLinks`** instead of plain `Link` widgets. The canonical entry inside `PageLinks` is a `Link` widget — not a `MenuItem` block instance.

❌ **Defining the sidebar HTML inline on every screen** instead of through the shared `Menu` block in `Common`. The block is the single source of truth — change once, propagates everywhere.

❌ **Putting the sidebar inside `MainContent` of `LayoutBlank`** instead of using `LayoutSideMenu`. `LayoutSideMenu` already has the right grid (sidebar column + main column, responsive collapse on mobile). Don't recreate the grid with custom CSS.

❌ **Using an `AdvancedHtml Tag="nav"`** to wrap nav links in the Navigation placeholder. The `Menu` block already provides nav semantics and is theme-integrated; wrapping in raw `nav` bypasses it.

❌ **Setting `Style` / `CustomStyle` / `SetStyle` / `Width` on the `PageLinks` container.** PageLinks ships with theme-correct padding and spacing. Overriding any of those produces nav items flush-left with no breathing room (the visual bug from screenshot review). Only fill PageLinks with `ILink` widgets — never style the container itself.

❌ **Wrapping nav Links in a custom `Container` inside `PageLinks`** (e.g. `pageLinksContainer.CreateWidget<IContainer>(...).CreateWidget<ILink>(...)`). The added wrapper inherits `(fill parent)` width and resets the Menu's intended spacing. Add the `ILink` widgets directly as siblings of whatever's already in PageLinks.

❌ **Adding emoji to nav Link text** (e.g. `linkText.Value = "\"🏠 Home\""`). Use a real `IIcon` widget alongside the Link's `ITextWidget` child, with `Icon = "<phosphor-name>"` and `IconSize = FontSize`.

## Related

- For a top horizontal menu instead, use `LayoutTopMenu` + `Menu` ([`../layouts.md`](../layouts.md)).
- For mobile-shell (slide-out) sidebars instead of persistent ones, use the `Sidebar` interaction pattern ([`../patterns/interaction.md#sidebar`](../patterns/interaction.md#sidebar)).
- For a footer area in the sidebar (e.g. user avatar, logout), use the `Menu.Footer` placeholder.
