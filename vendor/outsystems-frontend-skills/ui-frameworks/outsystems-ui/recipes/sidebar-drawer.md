---
name: osui-recipe-sidebar-drawer
description: How to build a slide-out drawer / side panel using the OutSystemsUI/Interaction Sidebar block — a transient panel that opens from the edge (right by default) for filters, cart, settings, detail views, or drilldowns. Distinct from the persistent left-nav rail in sidebar-navigation.md. Use when the request mentions "filter drawer / filter panel", "cart drawer", "slide-out panel", "settings drawer", "detail panel that slides in", "off-canvas menu", or any transient panel triggered by a button and dismissed by a close affordance.
---

# Recipe — Sidebar Drawer (slide-out panel)

> **Goal:** a transient side panel that slides in from the screen edge when triggered, contains its own header (title + close button) and body, and dismisses back off-screen. Uses the `Sidebar` block from `OutSystemsUI/Interaction` (NOT the layout's nav rail).

> **When to use:** filter drawer, cart drawer, settings panel, detail drilldown, mobile hamburger menu, "advanced options" panel — any transient affordance that overlays the page on demand and isn't part of the persistent chrome. **Not** for the persistent left nav rail of an app — that's `LayoutSideMenu` + `Menu` (see [`sidebar-navigation.md`](sidebar-navigation.md)).

## Disambiguation — two different things both called "sidebar"

| | **This recipe — `Sidebar` (block from `Interaction`)** | **`sidebar-navigation.md` — `LayoutSideMenu` + `Menu`** |
|---|---|---|
| Visibility | **Transient** — opens on trigger, closes on X / overlay click | **Persistent** — always visible, part of the chrome |
| Block used | `OutSystemsUI/Interaction/Sidebar` | `LayoutSideMenu` (Layouts) + `Menu` (Common) |
| Triggered by | A Button widget on the page (`Open filters`, ☰ hamburger, etc.) | Nothing — it just lives there |
| Contents | Anything: filters, cart, settings form, detail view | Nav links to the app's main screens |
| Typical position | Right edge (filters), left edge (mobile menu) | Always left |
| State driver | Boolean `LocalVariable` bound to `Sidebar.IsOpen` | None |

Tell-tale that you want THIS recipe (not sidebar-navigation): the panel is hidden initially, appears only after a click, has a close (X) button inside it, and contains content that's not navigation.

## Trigger phrases

- "Filter drawer / filter panel that slides in"
- "Cart drawer" / "cart slide-out"
- "Settings drawer / settings panel"
- "Detail panel" / "drilldown panel that opens on row click"
- "Off-canvas menu" / "mobile hamburger menu that slides in"
- "Advanced options panel" / "more filters drawer"
- "Slide-out panel from the [right / left]"

## What it produces

```
(parent placeholder — e.g. screen's MainContent or Header)
  ├── Button "btn"  →  OnClick: assigns IsDrawerOpen = True
  │     └── TextWidget "Open filters"
  ├── Sidebar block  (from OutSystemsUI/Interaction)
  │     args: IsOpen = IsDrawerOpen LocalVariable  (two-way bound)
  │     ├── Header placeholder
  │     │     └── Container Style="display-flex align-items-center justify-content-space-between" Width="(fill parent)"
  │     │           ├── TextWidget "Filters"   (drawer title)
  │     │           └── Button Style="btn border-size-none btn-small"   ← close button (X)
  │     │                 └── Icon Icon="x" Weight="regular"
  │     └── Content placeholder
  │           └── (drawer body — filters, cart items, settings form, etc.)
```

The `Sidebar.IsOpen` arg binds to a Boolean `LocalVariable` (`IsDrawerOpen`, default `False`). Toggling that variable opens/closes the drawer. The close button inside the drawer assigns `False` to the same variable.

## Building it (Model API)

```csharp
eSpace => {
    var app = eSpace.GetESpace();
    var screen = /* the screen or block hosting the drawer */;
    var outSystemsUI = app.References.Named("OutSystemsUI");
    var interaction = outSystemsUI.MobileFlows.Named("Interaction");

    // 1) LocalVariable that drives the drawer's open/close state.
    var isDrawerOpen = screen.CreateLocalVariable("IsDrawerOpen");
    isDrawerOpen.DataType = app.BooleanType;
    isDrawerOpen.SetDefaultValue("False");

    // 2) Open-drawer ScreenAction — assigns IsDrawerOpen = True.
    var openDrawer = screen.CreateScreenAction("OpenDrawer");
    var odStart = openDrawer.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
    var odAssign = openDrawer.CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>();
    odAssign.CreateAssignment("IsDrawerOpen", "True");
    odStart.Target = odAssign;
    var odEnd = openDrawer.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(odAssign, 1500);
    odAssign.Target = odEnd;

    // 3) Close-drawer ScreenAction — assigns IsDrawerOpen = False.
    var closeDrawer = screen.CreateScreenAction("CloseDrawer");
    var cdStart = closeDrawer.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();
    var cdAssign = closeDrawer.CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>();
    cdAssign.CreateAssignment("IsDrawerOpen", "False");
    cdStart.Target = cdAssign;
    var cdEnd = closeDrawer.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(cdAssign, 1500);
    cdAssign.Target = cdEnd;

    // 4) Trigger button on the page (whatever location makes sense — top bar, action area, etc.).
    var openButton = parentContainer.CreateWidget<ServiceStudio.Plugin.NRWidgets.IButton>();
    openButton.SetStyle("\"btn\"");
    var openLabel = (OutSystems.Model.UI.Mobile.Widgets.ITextWidget)openButton.Widgets.First();
    openLabel.Text = "Open filters";   // or "☰ Menu" with an Icon sibling
    openButton.OnClick.Destination = openDrawer;
    openButton.OnClick.BuiltInValidations = OutSystems.Model.Enumerations.ValidationBehavior.None;

    // 5) Sidebar block instance.
    var sidebarSig = interaction.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("Sidebar");
    var sidebar = parentContainer.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
    sidebar.SourceBlock = sidebarSig;
    // Two-way bind IsOpen to the LocalVariable. The Sidebar block handles slide-in/out animation.
    sidebar.SetArgumentValue(sidebarSig.InputParameters.Named("IsOpen"), "IsDrawerOpen");
    // Other args: Direction (Left / Right — default Right), HasOverlay, ExtendedClass — set as needed.

    // 6) Header placeholder — drawer title + close button.
    var headerPh = sidebar.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Header");
    headerPh.Widgets.ToList().ForEach(w => w.Delete()); // clear defaults

    var headerRow = headerPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
    headerRow.SetStyle("\"display-flex align-items-center justify-content-space-between\"");
    headerRow.Width = "(fill parent)";

    var drawerTitle = headerRow.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>();
    drawerTitle.SetStyleClasses("\"font-size-base font-semi-bold\"");
    drawerTitle.Text = "Filters";

    var closeButton = headerRow.CreateWidget<ServiceStudio.Plugin.NRWidgets.IButton>();
    closeButton.SetStyle("\"btn border-size-none btn-small\"");
    closeButton.Widgets.ToList().ForEach(w => w.Delete()); // remove default ITextWidget (icon-only button)
    var closeIcon = closeButton.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
    closeIcon.Icon = "x";
    closeIcon.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
    closeIcon.Weight = "regular";
    closeButton.OnClick.Destination = closeDrawer;
    closeButton.OnClick.BuiltInValidations = OutSystems.Model.Enumerations.ValidationBehavior.None;
    // Accessibility: aria-label on the icon-only close button.
    closeButton.ExtendedProperties.Add(new ExpressionDefinition.RecordLiteral(fields: [
        ("Property", "\"aria-label\""),
        ("Value", "\"Close\""),
    ]));

    // 7) Content placeholder — the drawer body. Fill with whatever the drawer holds:
    //    filters form, cart items list, settings, etc.
    var contentPh = sidebar.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Content");
    contentPh.Widgets.ToList().ForEach(w => w.Delete());
    // ...add filter inputs / cart IList / settings form here.
}
```

## Decision points

| Decision | Default | Override when |
|---|---|---|
| **Direction** | `Right` (filters / detail panels slide in from the right) | `Left` for mobile hamburger menus and off-canvas nav. |
| **`HasOverlay`** | `True` (dark backdrop behind the drawer when open) | `False` only when the drawer must NOT block underlying interaction (rare). |
| **Trigger button shape** | Plain `Button "btn"` with text label | Icon-only `Button "btn btn-icon"` for ☰ hamburger or filter-funnel icon (delete defaults, add `IIcon`). |
| **Close affordance** | Icon-only Button with `Icon="x"` in the header's right slot | Drawer can ALSO close via backdrop click (handled by the block when `HasOverlay=True`) — keep the X anyway as visible affordance. |
| **Header content** | Title + close button via `display-flex justify-content-space-between` | Add a subtitle by wrapping the title in a Column1+Column2 layout or a stacked Container. |
| **Two open / close actions vs one toggle** | TWO actions (`OpenDrawer`, `CloseDrawer`) — clearest intent | A single `ToggleDrawer` action with `Assign IsDrawerOpen = not IsDrawerOpen` works when the only entry point is the trigger button AND the close button. Two-actions is preferred when more places open/close the drawer (e.g. "Apply filters" closes the drawer after submitting). |
| **State scope** | Screen-level `LocalVariable` | Block-level `LocalVariable` when the drawer is inside a reusable block (each instance gets its own state). |

## Common pitfalls

❌ **Hand-rolling a slide-out drawer with a `Container` + custom CSS transitions** (`transform: translateX(100%)`, `transition: transform 0.3s`). The `Sidebar` block handles the slide-in/slide-out animation, the backdrop overlay, focus trapping, ESC-to-close, and theme-correct sizing. A hand-rolled version loses all of it.

❌ **Wiring the trigger button's `OnClick` directly to `Assign IsDrawerOpen = True` inline** without creating a named ScreenAction. The `OnClick.Destination` must point to a `ScreenAction` (named, with Start/End nodes) — inline assignment isn't valid. The two-action pattern (Open / Close) keeps the wiring explicit and lets you add side effects later (logging, telemetry, resetting filter state, etc.).

❌ **Forgetting the close button inside the drawer's `Header` placeholder.** `HasOverlay=True` does give the user backdrop-click-to-close, but a visible X is still expected for accessibility and mobile (where backdrop click is fiddly). Always include it.

❌ **Using `Popup` instead of `Sidebar` for a side panel.** `Popup` is a centered modal — it appears in the middle of the screen with a full backdrop. `Sidebar` slides in from an edge and only takes up a portion of the screen. Pick by visual intent: centered modal = `Popup`, edge drawer = `Sidebar`.

❌ **Putting a `LayoutSideMenu` / `LayoutTopMenu` instance inside the Sidebar's Content placeholder.** The Sidebar block is a panel, not a screen layout — it doesn't host nested chrome. Fill the Content with the actual body (filters, cart, etc.), not another Layout.

❌ **Skipping the `aria-label` on the icon-only close button.** Screen readers can't announce "X" — set `aria-label="Close"` via `ExtendedProperties` so the button is reachable and announced.

❌ **Sharing one `IsDrawerOpen` LocalVariable across two different drawers on the same screen.** Each Sidebar instance needs its own state variable, otherwise opening one opens both.

❌ **Confusing this with `sidebar-navigation.md`.** If the request says "sidebar" and the design shows a persistent left rail with nav links, use `LayoutSideMenu` + `Menu` from [`sidebar-navigation.md`](sidebar-navigation.md). This recipe is for *transient* slide-out panels, not the chrome.

## Related

- [`sidebar-navigation.md`](sidebar-navigation.md) — the PERSISTENT left-nav rail (different stack: `LayoutSideMenu` + `Menu`). Read the disambiguation table at the top of this recipe.
- [`popup-modal-dialogs.md`](popup-modal-dialogs.md) — centered modals (sibling pattern; pick by whether the affordance is a side-panel or a center-modal).
- [`../patterns/interaction.md`](../patterns/interaction.md) — `Sidebar`, `BottomSheet`, `ActionSheet`, `Popup` reference and arg list.
- [`../polish-checklist.md`](../polish-checklist.md) — items on default-children deletion (the Sidebar header / Content placeholders both ship with default content that must be cleared before populating).
