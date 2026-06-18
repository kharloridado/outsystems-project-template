# Where CSS Lives in OutSystems

## Priority order (low → high specificity by location)

1. **OutSystems UI base Theme** (LOCKED — do not edit)
2. **Theme module (O11) / Theme Library (ODC)** — your global brand layer
3. **Block CSS** — scoped to a single Block
4. **Screen CSS** — scoped to a single Screen
5. **Widget Style** — inline (avoid)

## Decision rules

| Situation | Put it in |
|---|---|
| New brand color/token | Theme — `:root` |
| BEM block used across 3+ apps | Theme |
| BEM block used in 1 Block | Block CSS |
| Page-specific tweak | Screen CSS |
| Override OS UI pattern globally | Theme — `ExtendedClass` + BEM |
| Customize pattern in one Block | Block CSS |

## Anti-patterns
- ❌ Global rules in Screen CSS (won't apply elsewhere)
- ❌ Page rules in Theme (bloats global stylesheet)
- ❌ Editing OutSystems UI module (locked + breaks on upgrade)
- ❌ Inline `style=""` for anything reused
