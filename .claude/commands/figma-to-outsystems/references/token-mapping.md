# Figma → OutSystems Token Mapping

Canonical mapping between Figma token categories and OutSystems UI CSS variables.

## Quick reference

| Figma Token | OutSystems UI CSS Variable |
|---|---|
| Color / Brand / Primary | `--color-primary` |
| Color / Brand / Primary Hover | `--color-primary-hover` |
| Color / Brand / Secondary | `--color-secondary` |
| Color / Neutral / 0 (white) → 10 (black) | `--color-neutral-0` … `--color-neutral-10` |
| Color / Semantic / Success | `--color-success` |
| Color / Semantic / Error | `--color-error` |
| Color / Semantic / Warning | `--color-warning` |
| Color / Semantic / Info | `--color-info` |
| Typography / Family / Body | `--font-family-body` |
| Typography / Family / Heading | `--font-family-heading` |
| Typography / Size / Display | `--font-size-display` |
| Typography / Size / H1–H6 | `--font-size-h1` … `--font-size-h6` |
| Typography / Size / Base | `--font-size-base` |
| Typography / Size / xs–2xl | `--font-size-xs` … `--font-size-2xl` |
| Typography / Weight / Light → Black | `--font-weight-light` … `--font-weight-black` |
| Spacing / Base | `--space-base` |
| Spacing / 0 → 96px | `--space-none` … `--space-3xl` |
| Radius / None → Pill | `--border-radius-none` … `--border-radius-pill` |
| Shadow / xs–xl | `--shadow-xs` … `--shadow-xl` |
| Breakpoint / sm | `--breakpoint-small` (768px) |
| Breakpoint / md | `--breakpoint-medium` (992px) |
| Breakpoint / lg | `--breakpoint-large` (1200px) |

## Workflow

1. Open Figma with OutSystems UI Kit 2.0 or designer's file
2. Inspect Variables panel
3. Map each Figma variable to its OS UI equivalent
4. Generate `:root` block
5. Paste into Theme CSS (O11) or Theme Library CSS (ODC)

## Naming conventions to enforce on designers

- ✅ `color/brand/primary` → maps cleanly to `--color-primary`
- ✅ `space/m` → `--space-m`
- ❌ `Color-Blue-500` (named by hue, not role)
- ❌ `Spacing/Medium-Default` (verbose, ambiguous)

The closer Figma naming is to OS UI conventions, the more automatable the pipeline.
