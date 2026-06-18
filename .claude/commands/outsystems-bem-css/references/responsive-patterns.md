# Responsive Patterns in OutSystems

## Breakpoints

Default OutSystems UI breakpoints (configurable via `SetDeviceBreakpoint` in `OnApplicationReady`):
- **Phone:** < 768px
- **Tablet:** 768–991px
- **Desktop:** ≥ 992px
- **Large Desktop:** ≥ 1200px

CSS variables: `--breakpoint-small`, `--breakpoint-medium`, `--breakpoint-large`

Body classes injected: `.desktop`, `.tablet`, `.phone`, `.portrait`, `.landscape`

## Mobile-first pattern (recommended)

```css
/* Base — applies at all sizes */
.acme-card {
  padding: var(--space-s);
  font-size: var(--font-size-s);
}

/* Tablet and up */
@media (min-width: 768px) {
  .acme-card {
    padding: var(--space-m);
    font-size: var(--font-size-base);
  }
}

/* Desktop and up */
@media (min-width: 992px) {
  .acme-card {
    padding: var(--space-l);
  }
}
```

## Prefer OS UI responsive utilities

Before writing `@media` queries:
```
mt-0..6, mt-sm-2, mt-md-3, mt-lg-4    (margin top with breakpoint suffix)
mb-, ml-, mr-, mx-, my-                (other sides)
pt-, pb-, pl-, pr-, px-, py-           (padding)
d-none, d-block, d-flex, d-grid        (display)
d-sm-none, d-md-block                  (with breakpoint)
col-xs-12, col-sm-6, col-md-4, col-lg-3  (grid)
```

Use these in the widget's **Style Classes** field — no media queries needed.

## Visibility utility classes
- `HiddenInDesktop`
- `HiddenInPortrait`
- `HiddenInSmartphone`
- `HiddenInLandscape`
- `ShowOnlyInMobile`

## When to write custom media queries

Only when:
1. Utility classes don't cover it
2. Adjusting properties beyond spacing/display (border-radius, font-size, layout)
3. Inside Block CSS that won't benefit from global utilities

## Anti-patterns
```css
/* ❌ Desktop-first (max-width) */
@media (max-width: 991px) { … }

/* ❌ Arbitrary breakpoints */
@media (min-width: 813px) { … }
```
