---
name: osui-styles-utilities
description: Comprehensive reference for OutSystems UI's CSS — utility classes (spacing, color, typography, layout, flex, position, display, image, border-radius, shadow), the full color palette (brand, semantic, neutrals, 12 color families × 7 shades each), the CSS custom properties exposed on :root (--color-primary, --space-base, --shadow-l, --header-size, focus colors, iOS safe areas, pattern-scoped variables). Use when writing custom CSS, picking a class for a widget Style argument, theming via :root variable overrides, or looking up the exact name of a color / spacing / shadow / radius token in OutSystems UI (Reactive Web + Phone App Template).
---

# OSUI Styles & Utility Classes

The full reference for OutSystems UI's CSS — utility classes, color palette, spacing scale, typography, borders, shadows, and the `:root` CSS variables exposed for theming. Tracks the official [OutSystems UI CheatSheet](https://outsystemsui.outsystems.com/OutSystemsUIWebsite/CheatSheet).

**Canonical doc:** [`ui-frameworks/outsystems-ui/styles-and-utilities.md`](../../../ui-frameworks/outsystems-ui/styles-and-utilities.md)

The full content is in the canonical doc. Includes:

- Naming convention (`.background-X`, `.text-X`, `--color-X`).
- Spacing scale (`xs`/`s`/`base`/`m`/`l`/`xl`/`xxl`) + uniform / directional / axis variants.
- Color palette: brand (`primary`, `secondary`), semantic (`info`/`success`/`warning`/`error` × Base + Light), neutrals (0–10), 12 color families (red, orange, yellow, lime, green, teal, cyan, blue, indigo, violet, grape, pink) × 7 shades.
- Typography: heading classes, font sizes, weights, transforms.
- Borders, radius (none/soft/rounded/circle, plus directional), border sizes.
- Shadows (none/xs/s/m/l/xl).
- Buttons: types, sizes, shapes, color overrides.
- CSS custom properties: app settings (`--header-size`, …), brand colors (`--color-primary`, …), focus colors, iOS safe areas, pattern-scoped variables.
- Utility classes: display, position, absolute helpers, width/height, text, images, flex (alignment, direction, gap, placement shortcuts), and misc (overflow, table-responsive, list-item, etc.).
- Recipes for common compositions (cards, KPI counters, hero sections, dark mode).
- Anti-patterns (hardcoded hex, inline styles, `!important`, `--token-*` confusion).

OutSystems UI uses `--color-*` / `--space-*` / `--shadow-*` / `--border-radius-*` etc. (NOT `--token-*` — that's Mobile UI).
