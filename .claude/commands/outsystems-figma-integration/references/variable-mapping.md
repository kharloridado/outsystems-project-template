# Figma Variables → OutSystems CSS Variables

How to map data returned from `Figma:get_variable_defs` to OutSystems UI CSS variables.

## Figma Variable structure

A Figma Variable looks like:
```
{
  "name": "color/brand/primary",
  "resolvedType": "COLOR",
  "value": { "r": 0.102, "g": 0.451, "b": 0.910 },  // 0-1 RGB
  "scope": "ALL_FILLS",
  "description": "Primary brand color"
}
```

## Type mapping

| Figma resolvedType | OutSystems CSS variable family | Conversion needed |
|---|---|---|
| COLOR | `--color-*` | Convert 0-1 RGB to hex `#RRGGBB` |
| FLOAT (units in px) | `--space-*`, `--font-size-*`, `--border-radius-*` | Direct value + `px` unit |
| STRING (font names) | `--font-family-*` | Direct value, wrap in quotes |
| BOOLEAN | (rarely useful) | Skip unless specifically needed |

## Name mapping

Figma Variable names use `/` as a separator. Convert to OutSystems UI variable names:

| Figma Variable Name | OutSystems CSS Variable |
|---|---|
| `color/brand/primary` | `--color-primary` |
| `color/brand/primary-hover` | `--color-primary-hover` |
| `color/neutral/0` | `--color-neutral-0` |
| `color/neutral/10` | `--color-neutral-10` |
| `color/semantic/success` | `--color-success` |
| `typography/family/body` | `--font-family-body` |
| `typography/size/h1` | `--font-size-h1` |
| `typography/size/base` | `--font-size-base` |
| `spacing/m` | `--space-m` |
| `spacing/2xl` | `--space-2xl` |
| `radius/soft` | `--border-radius-soft` |
| `shadow/m` | `--shadow-m` |

## Color conversion

Figma returns colors as 0-1 normalized RGB. Convert to hex:

```javascript
function figmaColorToHex({r, g, b, a}) {
  const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Example:
// { r: 0.102, g: 0.451, b: 0.910 } → "#1A73E8"
```

If alpha is present and not 1.0, use `rgba()` instead.

## Handling Figma Modes (themes)

Figma supports multiple modes per variable collection (e.g., Light/Dark). The MCP returns the current resolved value. To support theming in OutSystems:

1. Pull tokens once per mode
2. Generate separate `:root` blocks per mode
3. Use OutSystems' multi-theme strategy (Multi Theme Library in ODC; multiple Theme modules in O11)

## When Figma names don't match OutSystems conventions

If the designer uses non-standard names like `Color-Blue-500` instead of `color/brand/primary`:

1. Generate the `:root` block with semantic OutSystems names
2. Add a comment showing the mapping:

```css
:root {
  /* Figma: Color/Blue/500 */
  --color-primary: #1A73E8;
}
```

3. Flag the inconsistency in your audit output so the designer can rename in Figma for future automation.

## Variables vs Styles

Figma has both:
- **Variables** (new) → `Figma:get_variable_defs` returns these
- **Styles** (legacy) → Not directly returned by variable_defs; you may see them in `get_design_context` as referenced style names

Prefer Variables — they're the modern API and map cleanly to CSS custom properties. Styles are values without semantic meaning at the API level.

## What to do with the extracted variables

After mapping, route to the `outsystems-token-extractor` skill to generate the final `:root` block. Pass the mapped variables as input, not the raw Figma data.
