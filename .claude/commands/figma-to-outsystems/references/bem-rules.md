# BEM Rules — OutSystems Edition

## Naming convention

```
.{prefix}-{block}                            /* Block */
.{prefix}-{block}__{element}                 /* Element */
.{prefix}-{block}--{modifier}                /* Block modifier */
.{prefix}-{block}__{element}--{modifier}     /* Element modifier */
```

Prefix is stored in memory (e.g., `acme-`). Don't hard-code it — read from `OutSystems convention: prefix = "..."` memory entry.

## The "element vs block" rule

If something can be reused outside its parent, it's a **block**:
- Button inside a card → `acme-btn`, not `acme-card__button`
- Avatar inside a comment → `acme-avatar`, not `acme-comment__avatar`
- Header inside a card → `acme-card__header` ✅ (only makes sense inside card)

## Attaching to OS UI patterns

Every OS UI pattern has `ExtendedClass`:
```
ExtendedClass = "acme-card acme-card--featured"
```

## The 7 commandments

1. One block, one BEM tree
2. One class per state (`.card--is-open`, not `.card.is-open`)
3. No nested elements (`__el__el` forbidden)
4. No `[data-*]` styling
5. No ID styling
6. No hard-coded values (always `var(--token)`)
7. No `!important` without justification comment

## Utility classes coexist with BEM

OS UI utilities aren't BEM — that's fine. Use both:
```
Style Classes  = "mt-2 mb-3 p-3"        ← utilities
ExtendedClass  = "acme-card acme-card--featured"   ← BEM
```
