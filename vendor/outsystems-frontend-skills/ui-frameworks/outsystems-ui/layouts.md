---
name: osui-layouts
description: How to pick the right Layout block for a Reactive Web screen, and the placeholder structure each Layout exposes. Load this BEFORE building any screen — picking the wrong layout (especially defaulting to LayoutBlank) is the #1 source of fake-looking screens.
---

# OutSystems UI — Layouts

> Every Reactive Web screen wraps in a Layout block. The Layout owns the chrome (sidebar, top bar, header, footer) and exposes named placeholders for content. **Pick the Layout BEFORE filling in content** — it dictates everything that comes after.

## Picking a Layout

> ⚠️ **Exactly ONE Layout per screen — never nest.** A screen wraps in a single Layout block at the root. Never put a `LayoutSideMenu` inside a `LayoutTopMenu` (or vice versa) just because the design has both a sidebar and a top bar — `LayoutSideMenu` already includes a top bar. Two Layout blocks on one screen = duplicate placeholders, broken responsive grid, unfilled chrome, and the screen renders as a wireframe sandwich. If you find yourself instantiating a second Layout, stop and re-pick.

Pick by the **navigation pattern in the request**:

| Request says… | Layout | Why |
|---|---|---|
| "sidebar nav", "side menu", "left navigation panel" (no top bar mentioned) | `LayoutSideMenu` | Persistent left sidebar with `Navigation` placeholder + main content area. Already includes a top bar above the content (see anatomy below). |
| **Sidebar nav AND top header bar** (banking apps, B2B dashboards, admin consoles, most authenticated SaaS UIs) | `LayoutSideMenu` | The top bar is baked in. Don't add a second Layout — fill the `Header` placeholder for per-screen top-bar middle content. |
| "top nav", "horizontal menu", header with tabs across the top, NO left sidebar | `LayoutTopMenu` | Top bar with `Menu` block + 6-placeholder content tree (Header / ActionButton / Breadcrumbs / Title / Actions / MainContent). |
| Modal / popup with no chrome at all | `LayoutBlank` | No menu, no chrome — just `MainContent`. Use only when the request really is "no nav, no header, just the body." |

**Don't default to `LayoutBlank` for full screens.** That gives you nothing — no header, no nav, no chrome. Most user requests imply `LayoutSideMenu` or `LayoutTopMenu`. If the request mentions a left sidebar with nav items, the answer is `LayoutSideMenu` (even if the design also has a top header bar — that comes for free). Only choose `LayoutBlank` if you have explicit evidence the screen has no chrome at all.

## ⚠️ Before you add ANY Layout — delete the default one the screen ships with

**`CreateScreen` always inserts a default `LayoutTopMenu` widget at the screen root.** If you skip this step and just call `screen.AddWidget(LayoutSideMenu)`, you end up with **two Layouts at the screen root** — the default `LayoutTopMenu` (still there, with all your default placeholders empty) AND your new `LayoutSideMenu`. The page renders both stacked: a half-filled top-bar strip on top, and your sidebar UI underneath. This is the #1 most common layout regression and ALL of it comes from forgetting this single step.

**Mandatory pattern — inspect, then delete, then add:**

```csharp
var screen = flow.CreateScreen("Cards");

// 1. INSPECT. The screen is never empty after CreateScreen — it has a default LayoutTopMenu.
var existingLayouts = screen.GetAllDescendantsOfType<IMobileBlockInstanceWidget>()
    .Where(w => w.SourceBlock != null
        && (w.SourceBlock.Name == "LayoutTopMenu"
         || w.SourceBlock.Name == "LayoutSideMenu"
         || w.SourceBlock.Name == "LayoutBlank"))
    .ToList();

// 2. DELETE every existing Layout — even if it happens to match the one you wanted.
//    Re-creating from scratch is cleaner than mutating the default's placeholders.
foreach (var layout in existingLayouts) layout.Delete();

// 3. ADD the Layout you actually want.
var layoutBlock = eSpace.GetESpace().MobileFlows.Named("Layouts")
    .Nodes.OfType<IMobileBlockSignature>()
    .First(n => (n as IModelObject).DisplayName == "LayoutSideMenu");
var layoutInstance = screen.AddWidget<IMobileBlockInstanceWidget>(layoutBlock);
```

**Sanity check before you place ANY content widgets:**

```csharp
var layoutCount = screen.GetAllDescendantsOfType<IMobileBlockInstanceWidget>()
    .Count(w => w.SourceBlock?.Name?.StartsWith("Layout") == true);
// Must equal 1. If it's 2, you skipped step 2 above. Re-run the delete.
```

If `layoutCount > 1` here, **stop everything and fix it.** Filling placeholders on the wrong Layout (or filling MainContent on the default `LayoutTopMenu` while leaving an empty `LayoutSideMenu` next to it) is exactly the regression we're avoiding.

## When the design feels "too custom" for a Layout block (the dark-mode trap)

> ⚠️ **A bespoke visual design does NOT mean `LayoutBlank` + custom flex shell.** This is the failure mode where the agent looks at a rich design spec — dark mode, custom sidebar styling, non-default spacing, brand colors — and concludes "I need full control of the page surface." It then picks `LayoutBlank` and writes 100–300 lines of custom CSS re-implementing the sidebar grid, header strip, scrollable main area, hover states, scrollbar styling, etc. **Every line of that custom shell is regression to fake UI.**

The right move when the design looks visually custom:
1. **Pick the same Layout you'd pick if the design were "default styled"** — sidebar nav → `LayoutSideMenu`, top nav → `LayoutTopMenu`.
2. **Override OS UI CSS variables on the THEME's StyleSheet** (`--color-background-body`, `--color-neutral-0`–`-10`, `--color-primary`, etc.) — see [`styles-and-utilities.md#theming-the-app-dark-mode-full-rebrand-palette-swap`](styles-and-utilities.md#theming-the-app-dark-mode-full-rebrand-palette-swap).
3. **Fill placeholders with OS UI blocks** — `Card`, `CardSectioned`, `Columns*`, `IList` + `ListItemContent`, `UserAvatar`, `IconBadge`, `ProgressBar`, `Tag`, `Counter`. The blocks pick up the new theme variables automatically. You get dark mode for free.
4. **For per-screen visual flourishes** (a hero gradient, a specific card's accent border) — write a SHORT custom class on the screen's StyleSheet and apply via `Style` / `ExtendedClass`. Maximum ~5–15 lines of custom CSS per screen.

**Concrete heuristic — if you're about to write any of these in a screen StyleSheet, you've taken a wrong turn:**

| About to write | Stop and use |
|---|---|
| `min-height: 100vh; display: flex` for the page shell | `LayoutSideMenu` / `LayoutTopMenu` (the layout owns the shell) |
| `.sidebar { width: 240px; position: sticky; }` | `LayoutSideMenu` (the layout owns the sidebar grid) |
| `.topbar { display: flex; justify-content: space-between }` for the page header strip | `LayoutSideMenu`'s baked-in top bar + the `Header` placeholder for middle content |
| `.main { flex: 1; overflow-y: auto; padding: 24px }` | `LayoutSideMenu.MainContent` placeholder — overflow + padding handled by the layout |
| `.card { background: ...; border: ...; border-radius: ...; padding: ... }` | `Card` block (theme-aware shadow, radius, padding via `UsePadding` arg) |
| `.avatar { border-radius: 50%; background: linear-gradient(...) }` with initials inside | `UserAvatar` block (handles initials fallback, theme-aware) |
| `.notif-badge { position: absolute; top: -4px; right: -4px; ... }` over an icon | `IconBadge` block from `OutSystemsUI/Numbers` |
| `.progress-track { ... } .progress-fill { width: 68%; ... }` | `ProgressBar` block from `OutSystemsUI/Numbers` |
| `display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px` | `Columns4` block from `OutSystemsUI/Adaptive` |
| `.tx-list { display: flex; flex-direction: column }` of `.tx-row` divs | `IList` widget over an aggregate, with `ListItemContent` block per row (or `CardItem`) |
| `.donut { background: conic-gradient(...) }` | `DonutChart` block from `OutSystemsCharts/Charts` + `ChartLegend` addon |

If five or more rows in this table apply to the screen you're building, **you're rebuilding OutSystems UI inside `LayoutBlank`.** Switch to `LayoutSideMenu` (or `LayoutTopMenu`) and refactor the divs into blocks. The result is shorter, theme-aware, accessible, and responsive without any of the custom CSS.

### What "highly custom" actually justifies

A truly custom visual treatment justifies:
- A custom theme StyleSheet (variable overrides at `:root` on the theme).
- Per-screen visual flourishes via short `ExtendedClass` rules (a gradient on one card, a hero header background, an animation keyframe).
- A handful of bespoke utility classes (e.g. `.hb-vcard__chip` for a card-chip ornament).

It does NOT justify:
- A custom layout shell (the layout block does this).
- Custom card / avatar / badge / progress / chart / list reimplementations (the OS UI blocks do this).
- Hand-rolled responsive grid (the `Columns*` blocks + their `PhoneBehavior` arg do this).
- Hand-rolled scrollable main / sticky sidebar / overflow handling (the layout block does this).

### Reality check before you reach for LayoutBlank

Ask: "Of the visual specifics I want, which can be expressed as (a) theme variable override, (b) extended class on an existing block, (c) per-screen StyleSheet rule applied via ExtendedClass on a specific block?" If the answer for >80% of the specifics is "yes, those three," use `LayoutSideMenu` / `LayoutTopMenu`. The remaining 20% is what `Style` / `ExtendedClass` / per-screen StyleSheet rules are FOR.

`LayoutBlank` is for: modal popup screens, embed views, print-stylesheet variants — things that genuinely have no chrome. It is NOT for: "this design looks too custom for a layout block." That's the trap.

### The same trap applies to "card" surfaces

The exact same intuition that pushes the agent toward `LayoutBlank` under design pressure pushes it toward `Container` + custom class instead of `Card` block. Whenever the design says "card" — whether it's a stat card, a metric tile, a payment card surface, a toggle card, a perk chip — that ALWAYS means a real `Card` (or `CardSectioned` / `CardItem` / `CardBackground`) block. The visual treatment (gradients, dark surface, glow, scale-on-hover) goes via `ExtendedClass` arg + a SHORT custom class defined in the theme — NOT via wholesale `Container` + 200-line stylesheet.

**If you find yourself writing `widget.SetStyle("\"<project-prefix>-card\"")` or `widget.SetStyle("\"<project-prefix>-stat-card\"")` or `widget.SetStyle("\"hb-vcard--indigo\"")`** (any project-prefix-shaped class name applied to a `Container`):
1. Stop. The widget you're styling should be a `Card` block instance.
2. Replace the `Container` with `IMobileBlockInstanceWidget` whose `SourceBlock` is the OS UI `Card` (or `CardSectioned` / `CardItem`).
3. If you still want a one-off visual treatment, pass it via `Card.ExtendedClass` arg — `card.SetArgumentValue(cardSig.InputParameters.Named("ExtendedClass"), "\"linear-background-primary\"")` — and define `linear-background-primary` in the theme StyleSheet (NOT the screen StyleSheet).
4. **Verify the class is actually defined somewhere**. Applying `SetStyle("\"my-class\"")` without defining `.my-class` in any stylesheet is a no-op — the widget renders with default styling and the visual treatment never appears.

The same rule applies to:
- **`UserAvatar`** — never a `Container` + `.hb-avatar` with `border-radius: 50%` + gradient. Use the block.
- **`IconBadge`** — never a `Container` + `position: absolute; top: -4px;`. Use the block.
- **`ProgressBar`** — never `<div class="track"><div class="fill" style="width: 68%">`. Use the block.
- **`Tag`** — never a `Container` + `.hb-perk-chip` with `border-radius: 99px`. Use the block.
- **`StackedCards`** — never a custom-CSS card-stack with hand-rolled swipe handlers. Use the block from `OutSystemsUI/Interaction`.

See [`structural-skeleton.md#step-35--block-inventory-commitment-mandatory-before-any-execute_code`](structural-skeleton.md#step-35--block-inventory-commitment-mandatory-before-any-execute_code) for the forcing function: explicit "this region → that block" mapping before any code runs.

## Where Layouts live in the model

Layouts are **local to the app** in the `Layouts` flow (NOT in the OutSystemsUI library):

```csharp
var layouts        = app.MobileFlows.Named("Layouts");
var layoutSideMenu = layouts.Nodes.OfType<IMobileBlock>().Named("LayoutSideMenu");
```

For exact placeholder names, call `get_web_block_details(web_block_name: "LayoutSideMenu")` — names are usually consistent across templates but can vary slightly.

## Layout structure — placeholders

### `LayoutSideMenu`

| Placeholder | Required content | Notes |
|---|---|---|
| `Navigation` | **`Menu` block instance** (from app's `Common` flow), with nav entries as `Link` widgets inside `Menu.PageLinks` | The left rail. **MUST** wrap a `Menu` block — never raw `Container` of nav items, never `AdvancedHtml Tag="nav"`. See [`recipes/sidebar-navigation.md`](recipes/sidebar-navigation.md). |
| `Header` | (often empty) | **Middle slot of the top bar only.** The brand and user widget are baked into the Layout block (see anatomy below) — don't try to put a logo or avatar here. Use this for per-screen top-bar content like a search box, breadcrumbs, or quick filters. |
| `Breadcrumbs` | (often empty or `Breadcrumbs` block) | |
| `Title` | `AdvancedHtml` `Tag: "h1"` with screen title | The screen title MUST go here — never inline in `MainContent`. |
| `Actions` | (often empty or primary action button) | Screen-level actions. |
| `MainContent` | Your screen body | |
| `Footer` | (often empty) | |

**Anatomy of the LayoutSideMenu top bar.** The top bar above `MainContent` has three regions:

```
┌──────────────────────┬─────────────────────────────┬──────────────────────┐
│  ApplicationTitle    │       Header  placeholder   │        UserInfo      │
│  (block ref, Common) │       (per-screen content)  │  (block ref, Common) │
└──────────────────────┴─────────────────────────────┴──────────────────────┘
```

Only the middle (`Header` placeholder) is set per screen. The left and right slots are **instances of the `ApplicationTitle` and `UserInfo` blocks — both blocks live in the app's `Common` flow**, and `LayoutSideMenu` (in the `Layouts` flow) just references them. To change the brand wordmark or user widget, **edit the corresponding block in `Common`** — not the Layout, not the placeholder.

> **ApplicationTitle already has an Expression bound to the app name** (`GetEntryEspaceName()` or equivalent). For a text wordmark like "WISE", the right move is to open `Common/ApplicationTitle`, style the existing expression (typography, color, letter-spacing, transform — via `ExtendedClass` + a class on the theme StyleSheet), and leave the binding alone. **Don't hand-roll an `AdvancedHtml h1` with the wordmark text inside the Menu block or elsewhere** — the wordmark already exists as a first-class block; duplicating it means the brand drifts on app rename and shows up in two places in the chrome.

> **`UserInfo` owns the entire right side of the top bar** — user avatar, name, dropdown caret, AND any adjacent chrome icons (notification bell with badge, status indicators, language/theme toggles, quick actions). When the design shows a notification bell, mailbox icon, or any icon-badge clustered with the user avatar, **add it inside `Common/UserInfo`** — don't put it in the `Header` placeholder. The `Header` placeholder is the MIDDLE slot only (per-screen content like a search box or breadcrumbs); the right edge belongs to `UserInfo`. Adding a bell to the Header placeholder visually drifts left of the avatar and reads as a header artifact instead of a chrome control. The `IconBadge` block + Phosphor `IIcon` for the bell goes inside `UserInfo`, to the left of the existing avatar.

### `LayoutTopMenu`

Six placeholders — must ALL be emitted in this exact order, even when empty:

```
UIScreen.Widgets
  └── UIBlockInstanceWidget (SourceBlock = "LayoutTopMenu")
        └── PlaceholdersContent (6 entries, in order)
              ├── Header        ← Menu block (REQUIRED — Link widgets in Menu.PageLinks)
              ├── ActionButton  ← header-level action button (often empty)
              ├── Breadcrumbs   ← breadcrumb trail (often empty)
              ├── Title         ← AdvancedHtml h1 with screen title
              ├── Actions       ← screen-level action buttons (often empty)
              └── MainContent   ← screen body
```

> The Layout block list above is exhaustive for Reactive Web / Phone App apps. There's no `LayoutNative` for Reactive Web (that's a Mobile UI Template construct, out of scope here).

The `Header` placeholder follows the same rule as `LayoutSideMenu.Navigation`: it **MUST** host a `Menu` block instance (from the app's `Common` flow), with each nav entry as a `Link` widget inside `Menu.PageLinks`. Don't put raw widgets directly in `Header`.

**Anatomy of the LayoutTopMenu top bar.** Like `LayoutSideMenu`, the top bar has baked-in chrome elements (brand on the left, user widget on the right) that are part of the Layout block's own widget tree — not placeholders. The placeholder slots you fill from the screen are limited to the list above. **To change the brand or user widget you must edit the `LayoutTopMenu` block in the app's `Layouts` flow** — don't try to inject those widgets via placeholders.

Empty placeholders MUST still be emitted in widget JSON:

```jsonc
{ "Object": "PlaceholderContentWidget", "Placeholder": "ActionButton" }
```

### `LayoutBlank`

Single `MainContent` placeholder. **Truly no chrome** — unlike `LayoutSideMenu` and `LayoutTopMenu`, no baked-in brand, user widget, or top bar. Use ONLY for popup screens / modal content / explicit "no chrome" requests.

## Title placeholder — always `AdvancedHtml` h1

The screen title goes in the `Title` placeholder using `AdvancedHtml` with `Tag: "h1"`, never as plain text in `MainContent`:

```jsonc
{
  "Object": "PlaceholderContentWidget", "Placeholder": "Title",
  "Widgets": [{
    "Name": "ScreenTitle", "Object": "AdvancedHtml", "Tag": "h1",
    "content": [{ "Object": "TextWidget", "Text": "Request List" }]
  }]
}
```

This pattern (named widget + `Object: "AdvancedHtml"` + `Tag: "h1"` + a `TextWidget` child) is the canonical OS UI title — preserves heading semantics for accessibility and theme styling.

## Anti-patterns

❌ **Nesting two Layout blocks** because the design has both a sidebar AND a top header bar. `LayoutSideMenu` already includes a top bar (ApplicationTitle / `Header` placeholder / UserInfo). Use `LayoutSideMenu` alone — fill `Header` for per-screen middle content; edit the Layout block in the app's `Layouts` flow if the brand or user widget needs to change. Two Layout blocks at the screen root means duplicate placeholders, wasted chrome, and a broken responsive grid.

❌ **Renaming the Layout instance to "Layout"** (or any generic name). Keep the SourceBlock name (`LayoutSideMenu`, `LayoutTopMenu`) as the instance name so the widget tree stays self-documenting.

❌ **Trying to put a logo / brand image / user avatar inside the `Header` placeholder** of `LayoutSideMenu` or `LayoutTopMenu`. Those are baked-in widgets owned by the Layout block (`ApplicationTitle`, `UserInfo`) — the placeholder is only the middle slot. To change brand or user widget, edit the matching block in the app's `Common` flow (`Common/ApplicationTitle`, `Common/UserInfo`) — not the Layout.

❌ **Hand-rolling a brand wordmark as an `AdvancedHtml h1` + styled `TextWidget`** (e.g. inserting "WISE" / "ACME" inside the Menu block or as a custom widget in the sidebar). Every OS app already has an `ApplicationTitle` block in `Common` with an Expression bound to the app name. The correct move is to open `Common/ApplicationTitle`, style its existing expression via `ExtendedClass` + a theme-StyleSheet rule (font, weight, letter-spacing, transform, color), and let the binding own the text. Hand-rolled wordmarks duplicate the brand text, drift on app rename, and end up rendering twice (in `ApplicationTitle` AND wherever you placed the duplicate).

❌ **Putting the notification bell / mailbox icon / status indicator / quick-action icon in the `Header` placeholder** of `LayoutSideMenu` or `LayoutTopMenu`. The `Header` placeholder is the MIDDLE slot of the top bar — for per-screen content (search box, breadcrumbs, quick filters). Chrome icons that cluster with the user avatar (bell-with-badge, mail icon, theme toggle, language switcher) belong inside `Common/UserInfo` — that block owns the entire right side of the top bar and is the canonical home for those affordances. Adding the bell to `Header` drifts it left of the avatar and reads as a header artifact instead of a chrome control. To add a bell to UserInfo: open `Common/UserInfo`, drop in an `IconBadge` block (with `IIcon` Phosphor `bell` in its `Icon` placeholder) to the left of the existing avatar widget.

❌ **Defaulting to `LayoutBlank`** and building a custom `<Container Style="my-sidebar">` for the sidebar. `LayoutSideMenu` already has the right grid + collapse behavior.

❌ **Putting the screen title as plain text or `<h1>` directly in `MainContent`.** Use the `Title` placeholder with `AdvancedHtml Tag="h1"`.

❌ **Skipping empty placeholders in widget JSON** for `LayoutTopMenu`. All 6 must be present in order — missing ones cause silent layout failures.

❌ **Using `Container` to mimic a layout** (e.g. `Container > Container > Container` to fake `LayoutTopMenu`'s grid). Lose responsive behavior, theme integration, and accessibility roles.

❌ **Putting raw `Link` widgets, `Container`s, or `AdvancedHtml Tag="nav"` directly in `LayoutSideMenu.Navigation` or `LayoutTopMenu.Header`.** These placeholders are for `Menu` block instances. Nav links go inside `Menu.PageLinks` as `Link` widgets — see [`recipes/sidebar-navigation.md`](recipes/sidebar-navigation.md).

## Related

- [`recipes/sidebar-navigation.md`](recipes/sidebar-navigation.md) — wiring `LayoutSideMenu` + `Menu` block end-to-end.
- [`blocks-index.md`](blocks-index.md) — block lookup pattern + placeholder naming.
- [`widget-conventions.md`](widget-conventions.md) — widget JSON conventions.
