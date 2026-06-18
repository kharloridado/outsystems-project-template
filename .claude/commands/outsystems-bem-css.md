---
name: outsystems-bem-css
description: Write BEM-compliant CSS for OutSystems Reactive Web and ODC components that consumes design tokens from :root, follows the user's stored prefixing conventions, and is upgrade-safe against OutSystems UI updates. Use this skill whenever the user needs to write CSS for an OutSystems component, customize an OutSystems UI pattern, add a CSS class to a Block or Theme, override styles via ExtendedClass, or asks for BEM in any OutSystems context.
---

# OutSystems BEM CSS Generator

Generate production-grade BEM CSS for OutSystems Reactive Web and ODC.

## Pre-flight

1. Check `memory_user_edits` for "OutSystems convention:" entries. If missing → invoke `outsystems-onboarding` first.
2. Use the stored prefix (e.g., `acme-`) throughout. Never ask "what prefix?" — it's in memory.

## When to use

- User shares a component spec or screenshot and asks for CSS
- User asks to customize an OutSystems UI pattern (Card, Button, Tabs, Accordion, etc.)
- User asks to write styles for a custom Block
- User mentions `ExtendedClass`, Theme CSS, Block CSS, or Screen CSS
- User shares Figma component details and wants the OutSystems implementation
- User asks "how do I override [pattern name]?"

## When NOT to use

- Component doesn't exist in OutSystems UI → use `outsystems-web-component` skill instead (L5)
- User wants just a token update → use `outsystems-token-extractor` skill

## Inputs needed

From context or quick inference:
1. **What component?** (name, screenshot if available)
2. **OutSystems UI pattern this extends?** (Card, Button, etc. — or "Custom Block")
3. **CSS location?** (Theme / Block / Screen — see references/css-locations.md)
4. **States needed?** (hover, focus, disabled, active, error, loading…)

If anything is unclear, make a reasonable assumption and state it. Don't pause for clarification on every detail.

## BEM rules

```
.{prefix}-{block}                            /* Block */
.{prefix}-{block}__{element}                 /* Element */
.{prefix}-{block}--{modifier}                /* Modifier */
.{prefix}-{block}__{element}--{state}        /* Element state */
```

### Forbidden (refuse to generate)

```css
.acme-card.is-open { }                      /* coupling */
.acme-card[data-state="open"] { }           /* data attribute styling */
.acme-card { color: #1A73E8; padding: 16px; }  /* hard-coded values */
#b1-CardWrapper { }                         /* OutSystems-generated IDs */
.acme-card { color: red !important; }       /* unjustified !important */
```

### Required patterns

```css
.acme-card--is-open { }                     /* state as modifier */
.acme-card { color: var(--color-primary); padding: var(--space-m); }  /* tokens */
.acme-card:hover { }                        /* pseudo-classes OK */
```

## Output format

Always structure your response like this:

```css
/* ============================================
   Component: [Name]
   Pattern: [OS UI Pattern this extends, or "Custom Block"]
   Location: [Theme CSS / Block CSS / Screen CSS]
   Escalation Level: L1 / L2 / L3 / L4
   Tokens consumed: [list]
   ============================================ */

/* Block */
.acme-card { /* ... */ }

/* Elements */
.acme-card__header { }
.acme-card__body { }
.acme-card__footer { }

/* Modifiers (variants) */
.acme-card--featured { }
.acme-card--compact { }

/* States */
.acme-card--is-loading { }
.acme-card__header--is-active { }

/* Pseudo-state interactions */
.acme-card:hover { }
.acme-card:focus-visible { }
.acme-card[aria-disabled="true"] { }

/* Responsive (mobile-first) */
@media (min-width: 768px) {
  .acme-card { /* tablet+ */ }
}
```

Then provide:
1. **ExtendedClass string** to put in the OutSystems UI pattern (if applicable):
   ```
   ExtendedClass = "acme-card acme-card--featured"
   ```
2. **Where to paste this CSS** (Theme / Block / Screen)
3. **Any Block input parameters** that should be added (if building a custom Block)

## References

- `references/css-locations.md` — Where each type of CSS belongs
- `references/state-vocabulary.md` — Standard state modifier names
- `references/common-patterns.md` — BEM examples for common OS UI patterns
- `references/responsive-patterns.md` — Mobile-first patterns
