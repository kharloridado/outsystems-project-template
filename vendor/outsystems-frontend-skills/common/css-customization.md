---
name: outsystems-css-customization
description: CSS customization in OutSystems — where to put styles (Theme > Screen > Block), how to override framework CSS variables, design-token-vs-framework-variable distinction (Mobile UI uses --token-*, OutSystems UI uses its own), anti-patterns. Use when writing custom CSS, theming an app, or implementing dark mode.
---

# CSS Customization in OutSystems

> **Goal:** override or extend framework styling without breaking the cascade or scattering rules across the app.

## Where styles live (in order of preference)

1. **Application Theme stylesheet** — global, shared by every screen using that theme. **The default home for any custom CSS.** Centralising styles here is the single biggest maintainability win: one place to find the rule, one place to change it, no cascade surprises across copies of the same rule.
2. **Screen stylesheet** — scoped to one Screen. Use only when the styles are genuinely screen-specific and would never be reused (e.g., a marketing landing page hero).
3. **Block stylesheet** — scoped to a single Block. Use sparingly — only when the rule is truly local and shouldn't ever be applied elsewhere. The cost is that finding "where is `.my-card` styled?" later requires hunting through Blocks.
4. **`ExtendedClass` argument** on patterns — adds CSS classes to the block's root. Use to apply existing utility classes (`shadow-s`, `margin-bottom-base`) without writing new CSS.
5. **`Style` property on widgets** — escaped class string, e.g. `Style: "\"btn btn-primary\""`. See [widget conventions §4](../ui-frameworks/outsystems-ui/widget-conventions.md).

This priority order is the opposite of "scope as tightly as possible." OutSystems CSS lives or dies by maintainability, and a single Theme is far easier to audit, theme-switch, and rebrand than dozens of Block stylesheets containing partial rules.

## CSS variables — they're framework-specific

The two UI frameworks expose CSS variables differently. Don't assume they use the same system.

### OutSystems UI (Reactive Web + Phone App Template)

OutSystems UI defines its **own set of CSS variables on `:root`** as part of the framework. The most common ones (full catalog in [`../ui-frameworks/outsystems-ui/styles-and-utilities.md`](../ui-frameworks/outsystems-ui/styles-and-utilities.md)):

| Group | Variables |
|---|---|
| Brand | `--color-primary`, `--color-secondary`, `--color-primary-hover`, `--color-primary-selected`, `--color-focus-outer`, `--color-focus-inner` |
| Semantic colors | `--color-info`, `--color-success`, `--color-warning`, `--color-error` (each with `-light` variants) |
| Neutrals | `--color-neutral-0` (white) through `--color-neutral-10` (near-black) |
| Spacing | `--space-{none\|xs\|s\|base\|m\|l\|xl\|xxl}` |
| Typography | `--font-size-{display\|h1…h6\|base\|s\|xs\|label}` |
| Borders | `--border-radius-{none\|soft\|rounded\|circle}`, `--border-size-{none\|s\|m\|l}` |
| Shadows | `--shadow-{none\|xs\|s\|m\|l\|xl}` |
| App shell | `--header-color`, `--header-size`, `--side-menu-size`, `--bottom-bar-size`, `--color-background-body` |
| iOS safe areas | `--os-safe-area-{top\|right\|bottom\|left}` |

Override in your Application Theme to rebrand:

```css
/* In the Application Theme stylesheet */
:root {
  --color-primary: #ff6600;
  --color-primary-hover: #e55a00;
  --color-secondary: #1a1a2e;
  --border-radius-soft: 8px;
}
```

Every `.btn-primary`, `.background-primary`, `.text-primary`, etc. updates automatically.

### Mobile UI (Mobile UI Template, Ionic-based)

Mobile UI is the only framework that currently uses **[design tokens](../foundations/outsystems-design-tokens/design-tokens.md)**. Tokens generate CSS variables prefixed `--token-*`. Override them on `:root` in the Application Theme:

```css
:root {
  --token-colors-primary: #ff6600;
  --token-colors-primary-rgb: 255, 102, 0;
  --token-border-radius-200: 8px;
}
```

See [design-tokens.md](../foundations/outsystems-design-tokens/design-tokens.md) for the full token catalog.

> **Don't mix the two systems.** If your app uses OutSystems UI, override `--color-*`/`--border-*`/etc. (whatever the framework defines). If it uses Mobile UI, override `--token-*`. Targeting the wrong variable name has no effect.

## What to override, in order of preference

### A. Use existing utility classes

Both frameworks ship spacing, typography, color, layout, elevation, and border utility classes. Reach for them before writing new CSS:

| Need | Class examples |
|---|---|
| Spacing (uniform) | `padding-{none\|xs\|s\|base\|m\|l\|xl\|xxl}`, `margin-{…}` |
| Spacing (directional) | `margin-top-base`, `padding-bottom-l`, `margin-x-s` (horizontal axis), `padding-y-m` (vertical axis) |
| Typography | `heading1`–`heading6`, `font-size-{display\|base\|s\|xs\|label}`, `font-{light\|regular\|semibold\|bold}` |
| Color | `text-{primary\|secondary\|info\|success\|warning\|error}`, `text-neutral-0` through `text-neutral-10`, `background-<same names>` |
| Color families | `text-{red\|orange\|yellow\|lime\|green\|teal\|cyan\|blue\|indigo\|violet\|grape\|pink}-{darkest\|darker\|dark\|light\|lighter\|lightest}` |
| Layout | `display-flex`, `justify-content-{center\|flex-start\|flex-end\|space-between}`, `align-items-{center\|flex-start\|flex-end}`, `top-left`/`center`/`bottom-right` etc. (placement shortcuts) |
| Flex gap | `gap-{xs\|s\|base\|m\|l\|xl\|xxl}`, `row-gap-*`, `column-gap-*` |
| Elevation | `shadow-{none\|xs\|s\|m\|l\|xl}` |
| Border | `border-radius-{none\|soft\|rounded\|circle}` (plus directional variants), `border-size-{none\|s\|m\|l}` |
| Width / Height | `full-width`, `half-width`, `full-height-vh`, `full-height-minus-header`, `tablet-full-width`, `phone-full-width` |
| Position | `absolute-top`, `absolute-center`, `sticky`, `fixed`, `position-relative` |
| Images | `img-cover`, `img-rounded`, `img-circle`, `thumbnail` |

Full catalog at [`../ui-frameworks/outsystems-ui/styles-and-utilities.md`](../ui-frameworks/outsystems-ui/styles-and-utilities.md).

Apply via `Style: "\"<classes>\""` on a widget, or via `ExtendedClass` on a pattern. Class names are slightly different between OutSystems UI and Mobile UI — check the framework's stylesheet if a class doesn't apply.

### B. Override CSS variables in the Theme

For brand-wide changes (primary color, corner radius, font family), override the framework's CSS variables on `:root` in the Application Theme. See "CSS variables" above.

### C. Custom CSS in the Application Theme

When utilities and variable overrides don't cover the case, write the rule in the Application Theme stylesheet:

```css
/* In the Application Theme stylesheet */
.product-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-base);          /* OutSystems UI variable name */
}

.product-card__title {
  color: var(--text-default);
  font-size: var(--font-size-400);
}
```

Reference framework CSS variables (or `--token-*` for Mobile UI), not hardcoded values — they change per theme variant and the variable indirection is what makes that work.

Reserve Block-scoped CSS for rules that are *guaranteed* to never be reused outside that one Block.

## Anti-patterns

- **`!important`** — almost always means the override is at the wrong level or specificity. Fix the selector instead.
- **Scattering the same rule across multiple Block stylesheets** — guarantees drift. Centralise in the Theme.
- **Global selectors like `*`, `body`, or unscoped element selectors** — they fight framework defaults and cascade unpredictably. Always scope to a class.
- **Hardcoded color hex / pixel values for design-token concerns** — breaks dark mode, theme variants, and rebranding. Use the framework's CSS variables.
- **Editing the OutSystems UI / Mobile UI module CSS directly** — changes get overwritten on framework upgrades. Customize via your Application Theme.
- **Inline `style="…"` via the Attributes panel** — hard to override later, easy to miss when auditing styles. Prefer a class.
- **Setting `Style` on a `UIBlockInstanceWidget`** — silently ignored. Wrap the block in a `Container` instead. See [widget conventions §7](../ui-frameworks/outsystems-ui/widget-conventions.md#7-uiblockinstancewidget-cannot-be-styled-directly).
- **Mixing OutSystems UI variables and Mobile UI tokens in the same app** — pick one framework's variable system and stick with it.

## Inline style escape hatch

If you truly must apply a one-off style (a precise pixel offset that no class expresses), use `CustomStyle` on a `Container`:

```jsonc
{ "Object": "Container",
  "CustomStyle": "margin-top: 20px;",
  "content": [/* … */] }
```

Don't use this for color/spacing/typography — those belong in classes or variable overrides.

## CSS for state (hover, focus, active, disabled)

Both frameworks ship built-in state styling. Don't override unless necessary, and when you do:

- **Never remove `:focus { outline: none }` without a replacement.** Provide a custom focus style (e.g. `:focus-visible { box-shadow: 0 0 0 2px var(--border-focus-default); }`).
- Use the `:focus-visible` pseudo-class to scope keyboard-only focus rings (so mouse users don't see them).

See [`accessibility.md`](./accessibility.md) for full focus-handling rules.

## Dark mode and theme variants

If the app supports multiple themes, layer the variable overrides:

1. Define base values on `:root` (light theme) in the Application Theme stylesheet.
2. Override the same variables under a class or attribute selector (`.theme-dark`, `[data-theme="dark"]`):

```css
.theme-dark {
  --bg-body: #121212;
  --text-default: #e5e5e5;
  /* … */
}
```

(Mobile UI: replace with `--token-bg-body`, `--token-text-default`, etc.)

3. Toggle the class on `<html>` or `<body>` from a client action.

Framework patterns automatically pick up the new variable values — no per-pattern overrides needed.

## Performance considerations

- Application Theme stylesheets are loaded on every screen using that theme — keep them lean, but don't fragment them just for size. A well-structured 30 KB Theme is faster to load and easier to maintain than 30 Blocks each shipping 1 KB of partial CSS.
- Block stylesheets are bundled per-block — useful when a Block is genuinely heavy and rarely used.
- Don't import third-party CSS frameworks (Bootstrap, Tailwind, Foundation) on top of OutSystems UI / Mobile UI — they double the bundle size and conflict on common selectors.

See [`ui-performance.md`](./ui-performance.md) for full performance guidance.
