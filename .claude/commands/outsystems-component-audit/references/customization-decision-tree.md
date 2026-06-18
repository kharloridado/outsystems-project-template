# Customization Decision Tree (L1–L5 Escalation)

Walk top to bottom. Stop at the first level that satisfies the design.

```
┌─────────────────────────────────────────────────────┐
│  Q: Is the difference just a token value?           │
│     If YES → L1: Update :root token only            │
└─────────────────────────────────────────────────────┘
                       │ NO
                       ▼
┌─────────────────────────────────────────────────────┐
│  Q: Does an OS UI utility class do this?            │
│     If YES → L2: Attach utility via Style Classes   │
└─────────────────────────────────────────────────────┘
                       │ NO
                       ▼
┌─────────────────────────────────────────────────────┐
│  Q: Same pattern, different look (custom variant)?  │
│     If YES → L3: ExtendedClass + BEM modifier       │
└─────────────────────────────────────────────────────┘
                       │ NO
                       ▼
┌─────────────────────────────────────────────────────┐
│  Q: Custom API needed but OS UI pattern exists?     │
│     If YES → L4: Wrap pattern in custom Block       │
└─────────────────────────────────────────────────────┘
                       │ NO
                       ▼
┌─────────────────────────────────────────────────────┐
│  L5: Build vanilla JS Web Component + Block wrapper │
│  No OS UI pattern fits.                             │
└─────────────────────────────────────────────────────┘
```

## Per-level summary

### L1 — Token change
```css
:root { --color-primary: #7C3AED; }
```
**1 minute. Global effect. No CSS written.**

### L2 — Utility class
```
Style Classes: "text-neutral-8 pt-2"
```
**30 seconds. No CSS written.**

### L3 — ExtendedClass + BEM modifier
```
ExtendedClass = "acme-card acme-card--featured"

.acme-card--featured {
  border: 2px solid var(--color-primary);
}
```
**5–15 minutes per variant.**

### L4 — Wrap pattern in custom Block
```
Block: ProductCard (Patterns Library)
  Inputs: ProductName, Price, ImageURL, OnAddToCart
  Internal: OS UI Card + Image + Button widgets
  Block CSS: .acme-product-card BEM rules
```
**30–60 minutes. Reusable everywhere.**

### L5 — Web Component + Block wrapper
```
1. acme-pricing-toggle.js  (vanilla JS Web Component)
2. PricingToggle Block (wraps the Web Component)
3. Test HTML page for browser QA
```
**1–4 hours. Best for components OutSystems UI doesn't have.**

### L6 — Fork OutSystems UI
**Almost never. You'd lose all upstream updates.**

## Healthy distribution
- L1 / L2: 60–70%
- L3: 20–25%
- L4: 5–10%
- L5: 1–5%
- L6: 0%

If your codebase has too many L4–L5, the design system is fighting OutSystems UI. Talk to design.

## Why L5 = Web Component (not raw Block)

Previously, L5 meant "build a Block from scratch with HTML widgets." The user has chosen a better approach: **vanilla JS Web Components wrapped in Blocks.**

Benefits:
- Shadow DOM encapsulation (no CSS leaks)
- Framework-agnostic (works in O11 and ODC)
- Easy to import (single .js file as Script resource)
- Other devs use the Block, not the Web Component directly
- Future-proof (web standard, not platform feature)

Always route L5 to the `outsystems-web-component` skill.
