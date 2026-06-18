# Standard State Vocabulary for BEM Modifiers

Pick one vocabulary and use it consistently. Mixing `--open`, `--is-open`, `--isOpen`, `--opened` causes search failures and code review pain.

## Recommended: `--is-{state}` and `--has-{state}`

### `--is-{state}` — boolean visual state
```
.acme-card--is-active
.acme-card--is-loading
.acme-card--is-disabled
.acme-card--is-open
.acme-card--is-collapsed
.acme-card--is-selected
.acme-card--is-hidden
.acme-card--is-visible
.acme-card--is-sticky
.acme-card--is-pinned
```

### `--has-{condition}` — possesses something
```
.acme-card--has-error
.acme-card--has-image
.acme-card--has-icon
.acme-card--has-badge
.acme-card--has-action
```

### Variants (not states) — descriptive nouns/adjectives
Variants describe a permanent characteristic:
```
.acme-card--featured
.acme-card--compact
.acme-card--inverted
.acme-button--primary
.acme-button--secondary
.acme-button--ghost
```

## Pseudo-states (built-in CSS)
Not BEM modifiers — use directly:
```css
.acme-card:hover { }
.acme-card:focus-visible { }
.acme-card:active { }
.acme-card:disabled { }
.acme-input:invalid { }
```

## Don't do these
```
❌ .acme-card--open       (ambiguous: state or variant?)
❌ .acme-card--opened     (past tense — use --is-open)
❌ .acme-card--isOpen     (camelCase breaks BEM)
❌ .acme-card--state-open (verbose redundant prefix)
❌ .acme-card-open        (missing -- delimiter)
```
