# Complete OutSystems UI CSS Variable Inventory

Authoritative naming reference for `:root` blocks.

## Colors — Brand
```
--color-primary, --color-primary-hover, --color-primary-light, --color-primary-dark
--color-secondary, --color-secondary-hover, --color-secondary-light, --color-secondary-dark
```

## Colors — Neutral Scale
```
--color-neutral-0    (white)
--color-neutral-1 through --color-neutral-10 (darkest)
```

## Colors — Semantic
```
--color-success, --color-success-light, --color-success-dark
--color-error, --color-error-light, --color-error-dark
--color-warning, --color-warning-light, --color-warning-dark
--color-info, --color-info-light, --color-info-dark
```

## Colors — Extended (additional brand palette)
```
--color-extended-1 through --color-extended-5
```

## Typography — Families
```
--font-family-body
--font-family-heading
--font-family-mono
```

## Typography — Sizes
```
--font-size-display
--font-size-h1, --font-size-h2, ..., --font-size-h6
--font-size-base
--font-size-xs, --font-size-s, --font-size-m, --font-size-l, --font-size-xl, --font-size-2xl
```

## Typography — Weights
```
--font-weight-thin (100), --font-weight-extra-light (200), --font-weight-light (300)
--font-weight-regular (400), --font-weight-medium (500)
--font-weight-semi-bold (600), --font-weight-bold (700)
--font-weight-extra-bold (800), --font-weight-black (900)
```

## Typography — Letter Spacing / Line Height
```
--font-letter-spacing-s, --font-letter-spacing-m, --font-letter-spacing-l
--font-line-height-tight, --font-line-height-normal, --font-line-height-loose
```

## Spacing
```
--space-base   (foundation, typically 8px)
--space-none   (0)
--space-xs     (4px / ½ base)
--space-s      (8px / 1 base)
--space-m      (16px / 2 base)
--space-l      (24px / 3 base)
--space-xl     (32px / 4 base)
--space-2xl    (48px / 6 base)
--space-3xl    (96px / 12 base)
```

## Shape — Border Radius
```
--border-radius-none, --border-radius-soft, --border-radius-rounded
--border-radius-circle, --border-radius-pill
```

## Shape — Border Sizes
```
--border-size-s (1px), --border-size-m (2px), --border-size-l (4px)
```

## Elevation — Shadows
```
--shadow-none, --shadow-xs, --shadow-s, --shadow-m, --shadow-l, --shadow-xl
```

## Layout
```
--max-width-content, --max-width-narrow
--header-size, --bottom-bar-size, --side-menu-size
```

## Breakpoints (set via SetDeviceBreakpoint action)
```
--breakpoint-small  (768px)
--breakpoint-medium (992px)
--breakpoint-large  (1200px)
```

## Motion
```
--animation-duration-fast (150ms), --animation-duration-normal (300ms), --animation-duration-slow (500ms)
--animation-function-default, --animation-function-bounce, --animation-function-ease-in, --animation-function-ease-out
```

## Z-Index Scale
```
--z-index-base, --z-index-dropdown, --z-index-sticky, --z-index-fixed
--z-index-overlay, --z-index-modal, --z-index-popover, --z-index-tooltip, --z-index-notification
```

## Usage notes
- Stock OutSystems UI may not include all of these — add as needed
- Stick to the naming pattern
- Don't add a token unless reused in 2+ places
