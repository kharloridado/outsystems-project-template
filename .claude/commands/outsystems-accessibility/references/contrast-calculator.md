# WCAG Contrast Ratio Calculation

## The WCAG formula

```
relativeLuminance(rgb):
  for each channel (r, g, b) normalized 0-1:
    if channel <= 0.03928: linear = channel / 12.92
    else: linear = ((channel + 0.055) / 1.055) ^ 2.4
  return 0.2126 * R + 0.7152 * G + 0.0722 * B

contrast(rgb1, rgb2):
  L1 = relativeLuminance(lighter color)
  L2 = relativeLuminance(darker color)
  return (L1 + 0.05) / (L2 + 0.05)
```

## Thresholds

| Content Type | Minimum AA | Minimum AAA |
|---|---|---|
| Normal text (under 18pt) | 4.5:1 | 7:1 |
| Large text (18pt+ or 14pt+ bold) | 3:1 | 4.5:1 |
| UI components & graphical objects | 3:1 | (no AAA target) |
| Focus indicators | 3:1 | (no AAA target) |

## Common OutSystems token pair tests

When generating `:root` blocks, validate these pairs by default. (Values assume a typical SaaS palette; actual ratios depend on the user's specific colors.)

### Text on backgrounds

| Text Token | Background Token | Required | Typical Result |
|---|---|---|---|
| `--color-neutral-9` | `--color-neutral-0` | 4.5:1 | ~16:1 ✓ |
| `--color-neutral-7` | `--color-neutral-0` | 4.5:1 | ~8:1 ✓ |
| `--color-neutral-6` | `--color-neutral-0` | 4.5:1 | ~5:1 ✓ |
| `--color-neutral-5` | `--color-neutral-0` | 4.5:1 | **~3:1 ⚠️ (large text only)** |
| `--color-neutral-4` | `--color-neutral-0` | 4.5:1 | **~2:1 ❌** |
| `--color-primary` | `--color-neutral-0` | 4.5:1 | varies — check |
| `--color-neutral-0` | `--color-primary` | 4.5:1 | varies — check |
| `--color-neutral-0` | `--color-neutral-9` | 4.5:1 | ~16:1 ✓ |

### UI element pairs

| Foreground | Background | Required | Use Case |
|---|---|---|---|
| `--color-neutral-3` border | `--color-neutral-0` | 3:1 | Input border on white |
| `--color-primary` border | `--color-neutral-0` | 3:1 | Focus ring |
| Icon `--color-neutral-7` | `--color-neutral-0` | 3:1 | Toolbar icons |

## Generating CSS with contrast comments

When generating tokens, include a comment showing the contrast ratio:

```css
:root {
  /* Validated pairs (against --color-neutral-0): */
  --color-neutral-9: #0F172A;  /* 17.85:1 — passes AA & AAA */
  --color-neutral-7: #475569;  /* 7.93:1  — passes AA & AAA */
  --color-neutral-6: #64748B;  /* 5.16:1  — passes AA, fails AAA */
  --color-neutral-5: #94A3B8;  /* 3.21:1  — fails AA for body text */
  --color-primary:   #1A73E8;  /* 4.78:1  — passes AA */
}
```

## Flagging contrast failures

When a token pair fails, generate a warning block:

```
⚠️ Contrast issues detected:

❌ --color-neutral-5 (#94A3B8) on --color-neutral-0 (#FFFFFF) = 3.21:1
   Required: 4.5:1 for body text
   Suggestions:
   - Use --color-neutral-6 (#64748B, 5.16:1) for body text
   - Reserve --color-neutral-5 for large text (18pt+) only
   - Use as a non-text element (border, icon) where 3:1 is acceptable
```

## Tools for manual verification

- WebAIM Contrast Checker (webaim.org/resources/contrastchecker/)
- Stark plugin in Figma
- Chrome DevTools → Inspect element → click color swatch → contrast ratio shown
- axe DevTools browser extension
