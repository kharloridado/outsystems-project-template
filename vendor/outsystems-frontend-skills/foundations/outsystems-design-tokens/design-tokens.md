---
name: mobile-ui-design-tokens
description: Mobile UI design tokens — color/spacing/typography/border/elevation values exposed as --token-* CSS variables. Use when theming a Mobile UI app, picking a token for a CSS rule, or overriding tokens for branding/dark-mode. Tokens are Mobile UI-only — OutSystems UI uses its own --color-*/--space-* variables.
---

# Design Tokens

> Design tokens are named values for the visual decisions in an app — colors, spacing, typography, radii, shadows. Use them via CSS variables (`var(--token-…)`) or pre-built utility classes; override them on `:root` to rebrand.

**Where used:** the **Mobile UI Framework** ships design tokens out of the box. OutSystems UI (Reactive Web + Phone App Template) uses its own framework CSS variables — see [`common/css-customization.md`](../../common/css-customization.md).

## Why tokens

- **Theme switching for free.** Swap `--token-bg-body` once on a class scope and every block, screen, and component picks up the new value.
- **Consistency.** No more "is it 14px or 16px?" — there's one `body.md` font-size token and everyone uses it.
- **Rebranding without forking.** Change the brand color in one place; the whole app re-skins.
- **Dark mode / accessibility variants.** Layer overrides under selectors (`.theme-dark`, `[data-contrast="high"]`) — patterns react automatically.

## How to use a token

Three ways, in order of preference:

### 1. Utility class

For spacing, typography, color, layout, shadow, border — use the pre-built utility classes that the token system generates:

```jsonc
{ "Object": "Container", "Style": "\"margin-top-base padding-l background-primary text-neutral-0\"",
  "content": [/* … */] }
```

Class names are derived from the token names. Examples:

- `margin-top-base` ← `space.base`
- `padding-l` ← `space.l`
- `background-primary` ← `bg.primary.base.default`
- `text-neutral-0` ← `text.inverse` (or similar high-contrast token)
- `font-size-h2` ← `font.font-size.500`
- `shadow-s`, `shadow-l` ← `elevation.1`, `elevation.3`
- `border-radius-soft` ← `border.border-radius.200`

### 2. CSS variable in your stylesheet

When utilities don't cover what you need, reference the variable directly:

```css
.product-card {
  background: var(--token-bg-surface-default);
  color: var(--token-text-default);
  padding: var(--token-space-base);
  border-radius: var(--token-border-radius-200);
  box-shadow: var(--token-elevation-2);
}
```

The pattern is `var(--token-<path>)`, where `<path>` is the dotted token name with `.` replaced by `-`. Example: token `bg.primary.base.default` → `--token-bg-primary-base-default`.

### 3. Inline `Style` / `CustomStyle`

Last resort — reference variables in inline CSS via `CustomStyle`:

```jsonc
{ "Object": "Container",
  "CustomStyle": "padding: var(--token-space-base); background: var(--token-bg-surface-default);" }
```

## The three-tier hierarchy

Tokens are layered so an app can theme broadly or surgically:

```
Primitives  →  Semantics  →  Component tokens
```

| Tier | Purpose | Example | Override when |
|---|---|---|---|
| **Primitives** | Raw values (`blue.500`, `space.4`). | `primitives.blue.500: #2A5FE0` | You're rebranding the entire palette. |
| **Semantics** | Role-based aliases of primitives (`primary`, `success`, `danger`). | `primary.500: {primitives.blue.500}` | You want to remap "primary" without touching every usage. |
| **Component tokens** | Specific UI roles (`bg.primary.base.default`, `text.danger`). | `bg.primary.base.default: {primary.500}` | You want to tweak a specific surface in isolation. |

**Use component tokens in your CSS** — they're the most stable. Only reach for primitives when no semantic exists.

## Token catalog

### Spacing — `space.*` / `scale.*`

A scale of pixel values used for margins, padding, gaps, and sizes.

| Token name | Value |
|---|---|
| `space.0` | 0 |
| `space.1` | 1px |
| `space.2` | 2px |
| `space.3` | 3px |
| `space.4` | 4px |
| `space.6` | 6px |
| `space.8` | 8px |
| `space.10` | 10px |
| `space.12` | 12px |
| `space.16` | 16px (= `base`) |
| `space.20` | 20px |
| `space.24` | 24px |
| `space.28` | 28px |
| `space.32` | 32px |
| `space.36` | 36px |
| `space.40` | 40px |
| `space.44` | 44px |
| `space.48` | 48px |
| `space.56` | 56px |
| `space.64` | 64px |
| `space.72` | 72px |
| `space.80` | 80px |
| `space.96` | 96px |
| `space.112` | 112px |
| `space.128` | 128px |
| `space.136` | 136px |
| `space.144` | 144px |
| `space.160` | 160px |
| `space.200` | 200px |
| `space.248` | 248px |
| `space.296` | 296px |
| `space.360` | 360px |

**T-shirt aliases** (most common in utility classes): `xs` (4), `s` (8), `base` (16), `m` (24), `l` (32), `xl` (48), `xxl` (64).

`scale.*` mirrors `space.*` — same values, different name when the value is used for sizing rather than spacing.

**Common utility classes:**

- Margins: `margin-{top|right|bottom|left}-{xs|s|base|m|l|xl}`
- Padding: `padding-{base|s|m|l}` (and per-side variants)
- Gap (flex/grid): `gap-{xs|s|base|m|l}`

### Colors

#### Primitives — `primitives.*`

16 color families, each with 12 shades (100–1200):

`neutral`, `base` (white/black), `red`, `pumpkin`, `orange`, `yellow`, `lime`, `green`, `teal`, `aqua`, `blue`, `indigo`, `violet`, `purple`, `magenta`, `pink`.

Path: `primitives.<color>.<NNN>` (e.g. `primitives.blue.500`).

CSS variables: `var(--token-primitives-blue-500)`.

Each color also generates an RGB companion: `var(--token-primitives-blue-500-rgb)` → `42, 95, 224` — useful for `rgba(var(--token-primitives-blue-500-rgb), 0.1)`.

**Shadow colors:** 7 opacity levels (#0000000A → #0000002E) for elevation effects.

**State overlays:** `disabled` (`#FFFFFF99`), `press` (`#24242414`).

#### Semantic colors — `<role>.*`

Five role-based families, each mirroring a primitive family with 12 shades (100–1200):

| Semantic | Maps to | Use for |
|---|---|---|
| `primary.*` | `blue` | Brand-coloured surfaces, primary actions. |
| `info.*` | `blue` | Informational alerts, helper banners. |
| `success.*` | `green` | Success states, confirmations. |
| `danger.*` | `red` | Errors, destructive actions, alerts. |
| `warning.*` | `yellow` | Caution states, attention-needed banners. |

#### Component tokens — `bg.*` / `text.*` / `border.*` / `icon.*`

Use these in your CSS — they're the canonical "what to put where" tokens.

**Backgrounds (`bg.*`):**

- Semantic: `bg.primary.{base|subtle}.{default|press}`, plus the same shape for `danger`, `success`, `info`, `warning`.
- Neutral: `bg.neutral.{subtlest|subtle|base|bold|boldest}`.
- Surface: `bg.body`, `bg.surface.default`, `bg.surface.inverse`.
- Input: `bg.input.{default|read-only|press|disabled|bold}`.
- Select: `bg.select.{default|press}`.
- Extended (off-palette): `bg.extended.{pumpkin|orange|lime|teal|aqua|indigo|violet|purple|magenta|pink}.{base|subtle}`.

**Text (`text.*`):**

`default`, `subtle`, `subtlest`, `primary`, `disabled`, `danger`, `info`, `warning`, `success`, `inverse`, `select`, `link.{default|press|visited}`, plus `text.extended.<color>` for off-palette.

**Border (`border.*`):**

`default`, `boldest`, `subtle`, `subtlest`, `primary`, `success`, `warning`, `disabled`, `focus.{0|default|error}`, `danger.{base|press}`, `input.{default|press|read-only}`.

**Icon (`icon.*`):**

Same role names as text: `default`, `subtle`, `subtlest`, `disabled`, `primary`, `info`, `success`, `danger`, `warning`, `inverse`, `select`, `link.{default|press|visited}`, plus `icon.extended.<color>`.

### Typography — `display.*` / `heading.*` / `body.*` / `body.action.*` / `overline.*`

Composite tokens — each token bundles font-size, weight, line-height, letter-spacing.

| Group | Sizes | Weights |
|---|---|---|
| `display.{sm,lg}` | 32px, 36px | light, regular |
| `heading.{h1…h6}` | 28 → 18px | regular, medium, semi-bold, bold |
| `body.{lg,md,sm}` | 16, 14, 12 | regular, medium, semi-bold, bold |
| `body.action.{lg,md,sm,xs}` | 20, 16, 14, 12 | medium (1% letter-spacing) |
| `overline` | 12 (uppercase) | regular, medium, semi-bold, bold |

Apply via the matching utility class (e.g. `heading1`, `body-md`, `font-bold`) on a `TextWidget` `StyleClasses` or a Container `Style`. SCSS-savvy consumers can apply the whole composite via the SCSS map: `@include $token-heading-h1-regular`.

**Font primitives** (rarely referenced directly):

- Family: `-apple-system, system-ui, "Segoe UI", Roboto, …` (system stack).
- Weights 100–900 (`thin` → `black`).
- Sizes 11–36px.
- Letter-spacing: 0%, 1%, 1.5%.

### Border

**Widths** — `border.border-size.{0|025|050|075}` → 0, 1, 2, 3 px.

**Styles** — `none`, `solid`, `dashed`, `dotted`.

**Radii** — `border.border-radius.{0|050|100|200|300|400|500|800|1000|full}` → 0, 2, 4, 8, 12, 16, 20, 32, 40, 999 px.

The `full` value (`999px`) gives pill / circle shapes.

### Shape variants

The token system ships three border-radius "shape strategies" you can swap in at the theme level:

| Shape | Feel |
|---|---|
| **Soft** | Subtle rounded corners (4–16 px). |
| **Round** | Pill-shaped (999 px for small sizes, 12–40 px for large). |
| **Rectangular** | All 0 — sharp corners. |

Apply the strategy by importing the corresponding shape token set in the Application Theme. Patterns react automatically — no per-component overrides.

### Elevation — `elevation.{1,2,3,4}`

Four shadow tokens for depth. Each is a composite of two shadow layers of increasing intensity:

| Token | Use for |
|---|---|
| `elevation.1` | Subtle (raised cards, hover states). |
| `elevation.2` | Standard (default card surface). |
| `elevation.3` | Prominent (popovers, dropdowns). |
| `elevation.4` | Deep (modals, sheets). |

Plus `backdrop` (70% opacity black) for modal scrim layers.

### Transitions

**Curves** — `linear`, `quick` (`cubic-bezier(0,0,0.2,1)`), `base`, `expressive`, `bounce`.

**Durations** — 0, 100, 150, 200, 300, 500, 1000, 1500 ms.

### Z-index

`bottom` (-99999), `0`, `100`–`500`, `top` (99999).

## Variable naming pattern

Every token generates a CSS custom property (and an SCSS variable):

```
token name:      bg.primary.base.default
CSS variable:    --token-bg-primary-base-default
SCSS variable:   $token-bg-primary-base-default
```

The pattern is `--{prefix}-{path}` where `{path}` is the token path with dots replaced by hyphens. The default prefix is `token` (configurable per app).

Color tokens also emit an `-rgb` sibling for `rgba()` use:

```
--token-primitives-neutral-100-rgb: 243, 243, 243;

/* usage */
background: rgba(var(--token-primitives-neutral-100-rgb), 0.5);
```

## Customizing tokens for your app

Override any token's CSS variable on `:root` in the **Application Theme stylesheet**:

```css
:root {
  /* brand color */
  --token-primitives-blue-500: #FF6600;
  --token-primitives-blue-500-rgb: 255, 102, 0;

  /* corner radius — switch to softer */
  --token-border-radius-200: 12px;

  /* tighter spacing */
  --token-space-base: 12px;
}
```

For dark mode or theme variants, layer the overrides under a class:

```css
.theme-dark {
  --token-bg-body: #121212;
  --token-text-default: #e5e5e5;
  --token-bg-surface-default: #1e1e1e;
}
```

Toggle the class on `<html>` or `<body>` from a client action — every token-using pattern updates automatically.

See [`../../common/css-customization.md`](../../common/css-customization.md) for the broader CSS-customization rules (where to put styles, anti-patterns, etc.).

## Picking the right token

| You want to… | Use |
|---|---|
| Set the primary brand color | `var(--token-bg-primary-base-default)` (background) / `var(--token-text-primary)` (text) |
| Add standard padding to a Container | class `padding-base` (or `var(--token-space-base)`) |
| Make a card stand out | class `shadow-s` (or `var(--token-elevation-1)`) |
| Use the standard heading 2 style | class `heading2` |
| Use a danger/error red | `var(--token-text-danger)` for text, `var(--token-bg-danger-base-default)` for background |
| Match the input field's surface | `var(--token-bg-input-default)` |
| Pill-shaped button | `var(--token-border-radius-full)` |
| Modal backdrop | `var(--token-backdrop)` |
| Smooth transition on hover | `transition: all var(--token-transitions-duration-200) var(--token-transitions-curve-quick);` |

## Anti-patterns

- **Hardcoded hex / pixel values** for color, spacing, typography, radius. Use tokens — overrides won't reach hardcoded values.
- **Reaching for a primitive when a semantic exists.** `var(--token-primitives-blue-500)` is brittle; `var(--token-bg-primary-base-default)` survives a rebrand.
- **Picking arbitrary `space.*` values** to hit a pixel-perfect mockup. Round to the nearest scale step; the scale is the design language.
- **Mixing tokens and OutSystems UI's own framework variables** in the same app. Pick the framework that matches your stack and use its variable system. Mobile UI = tokens (`--token-*`); OutSystems UI = framework-defined `:root` variables.
- **Overriding tokens at component or screen level** when the change is brand-wide. Override on `:root` in the Application Theme.
- **Forgetting to update the `-rgb` sibling** when overriding a color used in `rgba()` callsites. They drift silently.
