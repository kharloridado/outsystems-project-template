---
name: osui-recipe-avatar-and-icon-badge
description: How to render a user avatar (initials fallback or photo) using the UserAvatar block, and how to overlay a notification count on an icon using the IconBadge block. Use when the request mentions "user avatar", "profile picture", "avatar with initials", "notifications bell with badge / count", "unread count over an icon", "user info area in a sidebar / top bar".
---

# Recipe — Avatar and Icon Badge

> **Goal:** the canonical OutSystems UI patterns for two highly-recurring elements that agents almost always re-invent in CSS:
> - **`UserAvatar`** — circular avatar with photo fallback to initials. Used in sidebars, top bars, comment threads, list rows.
> - **`IconBadge`** — an icon with a count overlay (bell + 3 unread, cart + 5 items). Used in app bars, navigation, summary tiles.

> **When to use:** anywhere the request mentions an avatar, profile picture, initials, a notifications bell with count, an unread badge, or any "icon + small numeric overlay." If you're about to write `border-radius: 50%; background: linear-gradient(...)` for an avatar, or `position: absolute; top: -4px; right: -4px;` for a badge — stop and use these blocks instead.

## Trigger phrases

- "User avatar / profile picture / avatar with initials fallback"
- "Show the user's photo if uploaded, otherwise initials"
- "Notifications bell with a 3 / red dot / count"
- "Cart icon with unread count overlay"
- "Top bar with bell + avatar"
- "Sidebar user info: avatar + name"
- "Avatar with online / active / away status dot" — a small solid dot at top-right of the avatar (presence indicator). NOT a count badge — different pattern, see **Variant — status dot** below.
- "UserInfo customization: add a notification bell next to the avatar" — the canonical top-bar user cluster, see **Combining** section below.

## Block 1 — `UserAvatar`

**Where it lives**: `OutSystemsUI/Content`.

**Purpose**: a single widget that handles photo OR initials display, theme-aware sizing, and shape consistency. Falls back from photo → initials automatically based on `Image` arg.

### Arguments

| Arg | Type / values | Use |
|---|---|---|
| `Name` | Text expression | Drives initials when `Image` is not set. Pass `"Alex Johnson"` → renders "AJ". |
| `Image` | Image-binary expression or null | When set, shows the photo; when null, falls back to initials from `Name`. |
| `Size` | `Entities.Size.Small` / `Medium` / `Large` | Theme-controlled diameter — never hardcode pixels. |
| `Shape` | `Entities.Shape.Rounded` / `Soft` / `Sharp` | Default Rounded gives the circle. |
| `Color` | `Entities.Color.*`  | Background tint of the initials chip. |
| `IsLight` | `True` / `False` / null | Pairs with `Color` for light-tinted variants. |
| `ExtendedClass` | Text | Optional extra utility classes (e.g. `"linear-background text-neutral-10"` for a gradient avatar background). |

### Canonical usage (Model API)

```csharp
var content = outSystemsUI.MobileFlows.Named("Content");
var userAvatarSig = content.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("UserAvatar");

var avatar = parentContainer.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
avatar.SourceBlock = userAvatarSig;
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Name"),  "\"Alex Johnson\"");
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Image"), null);  // or "GetUser.List.Current.User.Photo"
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Size"),  "Entities.Size.Medium");
// Color / Shape / IsLight left at defaults (theme decides).

// For a gradient-background variant (used when the avatar is a visual focal point in a top bar):
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("ExtendedClass"),
    "\"linear-background text-neutral-10\"");
```

## Block 2 — `IconBadge`

**Where it lives**: `OutSystemsUI/Numbers`.

**Purpose**: an icon with a small numeric badge overlay (typically top-right). Handles positioning, badge color, and icon styling consistently.

### Arguments

| Arg | Type / values | Use |
|---|---|---|
| `Number` | Integer expression | The count shown in the badge. Pass `"3"` literal or `"GetUnreadNotifications.Count"`. |
| `Color` | `Entities.Color.*` | Badge background color. `Red` for alerts/unread, `Primary` for branded counts. |
| `IsLight` | `True` / `False` | `False` = solid badge (recommended for high-emphasis counts), `True` = subtle pill. |
| `ExtendedClass` | Text | Optional extra utility classes. |

### Placeholders

- `Icon` — the icon being badged. Drop an `IIcon` widget in here (Phosphor name, `IconSize.FontSize`). The block's default content can be deleted before adding your icon.

### Canonical usage (bell + 3 red badge)

```csharp
var numbers = outSystemsUI.MobileFlows.Named("Numbers");
var iconBadgeSig = numbers.Nodes.OfType<OutSystems.Model.UI.Mobile.IMobileBlockSignature>().Named("IconBadge");

var badge = parentContainer.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
badge.SourceBlock = iconBadgeSig;
badge.SetArgumentValue(iconBadgeSig.InputParameters.Named("Number"),  "3");
badge.SetArgumentValue(iconBadgeSig.InputParameters.Named("Color"),   "Entities.Color.Red");
badge.SetArgumentValue(iconBadgeSig.InputParameters.Named("IsLight"), "False");

// CRITICAL: clear the Icon placeholder default content before adding your icon.
var iconPh = badge.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Icon");
iconPh.Widgets.ToList().ForEach(w => w.Delete());

var bell = iconPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
bell.Icon = "bell";
bell.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
bell.Weight = "fill";   // or "regular"
bell.SetStyle("\"icon text-neutral-7\"");
```

### Combining: avatar wrapped in IconBadge

A common pattern — top-right user avatar with a notification dot — is `IconBadge` containing `UserAvatar` in the Icon placeholder. The badge's `Number` shows over the avatar's bottom-right.

```csharp
// IconBadge.Icon placeholder receives the UserAvatar instance instead of an IIcon.
var avatar = iconPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
avatar.SourceBlock = userAvatarSig;
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Size"),  "Entities.Size.Medium");
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Image"), null);
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Color"), "Entities.Color.Neutral0");
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Name"),  "\"\"");  // empty to suppress initials when image-only
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("ExtendedClass"),
    "\"border-size-s border-size-s\"");
```

### Combining: UserInfo cluster — avatar + bell with shared badge (canonical top-bar pattern)

When you customize `Common/UserInfo` to add a notification bell next to the user avatar, the canonical shape is **one `IconBadge` wrapping BOTH the `UserAvatar` AND a bell `IIcon` as siblings in its `Icon` placeholder**. The `Number` badge floats top-right of the cluster (visually over the bell). This is the pattern demonstrated by the `AvatarWithIconAndBadge` reference block.

```csharp
// Inside Common/UserInfo, in place of (or alongside) the existing avatar.
var badge = userInfoBlock.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
badge.SourceBlock = iconBadgeSig;
badge.SetArgumentValue(iconBadgeSig.InputParameters.Named("Number"),  "3");                       // or unread-count expression
badge.SetArgumentValue(iconBadgeSig.InputParameters.Named("Color"),   "Entities.Color.Red");
badge.SetArgumentValue(iconBadgeSig.InputParameters.Named("IsLight"), "False");

var iconPh = badge.PlaceholdersContent.FirstOrDefault(p => p.Placeholder?.Name == "Icon");
iconPh.Widgets.ToList().ForEach(w => w.Delete());

// Sibling 1: the user avatar
var avatar = iconPh.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
avatar.SourceBlock = userAvatarSig;
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Size"),  "Entities.Size.Medium");
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Color"), "Entities.Color.Neutral5");
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Name"),  "\"\"");
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("ExtendedClass"),
    "\"border-size-s\"");

// Sibling 2: the bell icon
var bell = iconPh.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>();
bell.Icon = "bell";
bell.IconSize = ServiceStudio.Plugin.NRWidgets.Enumerations.IconSize.FontSize;
bell.Weight = "fill";
```

**Where this goes**: inside the `UserInfo` block in the app's `Common` flow — `LayoutSideMenu` / `LayoutTopMenu` already instance `UserInfo` at the top-bar right slot. **Don't put this cluster in the screen's `Header` placeholder** (which is the middle slot for per-screen content); edit `Common/UserInfo` once and the badge appears on every screen. See [`../layouts.md`](../layouts.md) for the top-bar anatomy.

#### Composing multiple peers inside `Common/UserInfo` (search + theme toggle + bell + welcome + avatar)

When the design shows **multiple** chrome elements next to the avatar (e.g. search icon button + theme toggle + bell-badge + "Welcome back" text + avatar), they must sit inside a `Container` styled `display-flex align-items-center column-gap-s` (or `column-gap-base` if the design has more breathing room). Adding them as direct sibling widgets of UserInfo's existing avatar — without a flex wrapper with explicit gap — leaves them rendered flush against each other (inline-flow with no spacing).

```csharp
// Inside Common/UserInfo, BEFORE adding the chrome cluster:
var clusterRow = userInfoRoot.CreateWidget<IContainer>("ChromeCluster");
clusterRow.SetStyle("\"display-flex align-items-center column-gap-s\"");  // ← horizontal peers, explicit gap

// Now add each peer as a child of clusterRow:
//   searchBtn (IButton, icon-only, ExtendedClass="btn icon-round-btn")
//   themeBtn  (IButton, icon-only, ExtendedClass="btn icon-round-btn")
//   bellBadge (IconBadge wrapping IIcon "bell")
//   welcome   (ITextWidget "Welcome back, …")
//   avatar    (UserAvatar)
```

The `column-gap-s` utility class (8px) is the most common — match the design's spacing. For pure flex-row composition the parent's `display-flex` is required; without it the gap class is a no-op.

### Variant — avatar with status dot (online / active presence indicator)

When the design shows a small solid dot (no number) at the top-right of an avatar — an online/active/away indicator — this is **NOT `IconBadge`** (which is for numeric overlays). The canonical pattern is a `position-relative` Container wrapping the `UserAvatar` plus a tiny absolutely-positioned Container styled with OS UI utility classes. From the `AvatarWithStatusDot` reference block:

```csharp
// Outer wrapper makes the dot's absolute positioning resolve to the avatar's box.
var wrap = parentContainer.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
wrap.SetStyle("\"position-relative\"");
wrap.Width = "auto";

// The avatar itself.
var avatar = wrap.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();
avatar.SourceBlock = userAvatarSig;
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("ExtendedClass"), "\"border-size-s\"");
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("Name"),          "\"\"");
avatar.SetArgumentValue(userAvatarSig.InputParameters.Named("IsLight"),       "False");

// The status dot — 12px solid circle pinned to the avatar's top-right.
var dot = wrap.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>();
dot.SetStyle("\"background-red border-radius-circle absolute-top-right position-absolute\"");
dot.Width = "12px";
```

**Color the dot via OS UI utility class**, not raw CSS — swap `background-red` for `background-success` (green for online), `background-warning` (amber for away), `background-neutral-5` (gray for offline), etc. The 12px width is the only hardcoded value; everything else is theme-aware.

**Don't reach for `IconBadge` for this** — IconBadge expects a `Number` and renders a numeric pill; a presence dot is decorative and has no count.

## Decision points

| Decision | Default | Override when |
|---|---|---|
| **`UserAvatar.Size`** | `Medium` | `Small` for list rows, `Large` for hero / profile screens. |
| **`UserAvatar.Image` source** | null (initials fallback) | Bind to `<Aggregate>.List.Current.User.Photo` for real user data. |
| **`UserAvatar.Color`** | Leave unset (theme decides) | `Entities.Color.Primary`/`Secondary`/etc. when the avatar should accent the brand. |
| **`IconBadge.Number`** | Literal expression for prototypes | `<Aggregate>.Count` or a local variable bound to a server action. |
| **`IconBadge.Color`** | `Red` for alerts/unread | `Primary` for branded counts; `Success` for completed; `Warning` for pending. |
| **`IconBadge.IsLight`** | `False` (solid) | `True` only when the badge is decorative and shouldn't compete with surrounding emphasis. |

## Common pitfalls

❌ **Building an avatar from a `Container` + `border-radius: 50%` + `background: linear-gradient(...)` + a `TextWidget` with initials.** That's hand-rolling what `UserAvatar` already provides — and you lose theme awareness, shape consistency, and the photo fallback.

❌ **Using a `Container` with `position: absolute; top: -4px; right: -4px; background: red; border-radius: 50%`** as a notification badge. Same trap — `IconBadge` handles positioning, sizing, and theme color tokens correctly. The CSS-positioned badge breaks under different icon sizes and theme variants.

❌ **Hardcoding avatar pixel sizes** (`width: 40px; height: 40px;`). Use `UserAvatar.Size = Entities.Size.Small/Medium/Large` — the theme controls the actual diameter.

❌ **Forgetting to clear `IconBadge.Icon` placeholder default content** before adding your icon. The default content stacks under your icon.
```csharp
iconPh.Widgets.ToList().ForEach(w => w.Delete());  // ALWAYS first
```

❌ **Using emoji as the badged icon** (`"🔔"` in a TextWidget instead of `IIcon` with `Icon = "bell"`). Emoji don't respect theme color, don't scale with typography, and aren't accessible.

❌ **Setting `UserAvatar.Image` to a static asset path string** (`"/images/avatar.png"`). The `Image` arg is for binary/entity-attribute bindings (`<Aggregate>.List.Current.User.Photo`) — for static images use a separate `IImage` widget.

❌ **Putting two siblings — an `IIcon` and a separately-positioned count `<span>` — instead of using `IconBadge`.** The block exists exactly to compose those two visually.

❌ **Using `IconBadge` for a presence dot (online / away indicator).** IconBadge renders a numeric pill — there's no "dot-only" mode. For a presence dot use the `position-relative` wrapper + 12px absolute-positioned circle Container pattern (see **Variant — status dot**). Setting `IconBadge.Number = 0` doesn't give you a dot; it gives you a pill with "0".

❌ **Customizing `Common/UserInfo` by adding the bell+badge in a screen's `Header` placeholder instead.** The `Header` placeholder is the middle slot of the top bar (per-screen content). The avatar+bell cluster belongs in the `UserInfo` block (right slot) — edit it once in `Common/UserInfo` and the cluster appears on every screen. See [`../layouts.md`](../layouts.md) for the top-bar anatomy.

❌ **Adding multiple chrome peers (search button + theme toggle + bell + welcome text + avatar) inside `Common/UserInfo` as direct siblings, without a flex wrapper with explicit `column-gap-*`.** The peers render flush against each other — no breathing room — because `IText` / `IButton` / block-instance widgets are inline-flow by default. Wrap them in a `Container` with `Style="\"display-flex align-items-center column-gap-s\""` (see "Composing multiple peers" above). The `column-gap-s` utility (8px) is the typical choice; pick `column-gap-base` (16px) when the design has more breathing room.

❌ **Writing a CSS rule that targets `.user-info` (or any popover-capable block's root selector) with `width: NN%` and/or `margin: NN%`.** `UserInfo` has a built-in popover/responsive state — on narrow viewports its content collapses into a `.popover-bottom` panel that should size to its content. A theme rule like:

```css
.user-info { width: 98%; margin-right: 2%; }
```

bleeds into ALL of UserInfo's visual states (including the popover) and produces a panel spanning nearly the full viewport, with a tiny right margin. Symptoms in DevTools: `.user-info[data-popover].popover-bottom { width: 98% }` showing up as the winning rule on a stretched-out panel.

**Fix:** never apply `width: NN%` / `margin: NN%` to a popover-capable block's root. If you need to constrain the popover, target a CHILD wrapper (`.user-info > .content-wrapper`), or set a fixed/max width (`max-width: 320px`) on a child Container you control. If you're trying to make UserInfo's *top-bar form* (not the popover) take a specific width, use the OS UI utility classes (`full-width`, `half-width`) on a wrapping `Container` INSIDE UserInfo — not a theme rule on the block's class root. This applies equally to other popover/overlay-capable blocks: `Sidebar`, `BottomSheet`, `Dropdown`, `FloatingContent`, `Notification`. **General smell:** `width: 98%` (or any "almost full but not quite" percentage) is almost always a wrong workaround — the right answer is `full-width` (100%) on a properly box-sized parent, or a `max-width` in absolute units. See [`../polish-checklist.md`](../polish-checklist.md) item on percentage-width rules.

## Related

- [`patterns/content.md#useravatar`](../patterns/content.md#useravatar) — full UserAvatar arg reference.
- [`patterns/numbers.md`](../patterns/numbers.md) — IconBadge + other Numbers pattern blocks (Counter, ProgressBar, ProgressCircle, Rating).
