# tokens/

Source for the ODC theme. `index.css` imports `colors.css`, `spacing.css`, `typography.css`.
`npm run build:theme` assembles them into **two** files to paste into the ODC Theme editor:
`dist/tokens.css` (the design tokens — one consolidated `:root` plus device-scoped
redefinitions) and `dist/theme.css` (classes and overrides, no tokens). Paste both; a
token-only change then means re-pasting only `dist/tokens.css`.

These values ARE the brand — build to them exactly; contrast failures are findings, not edits here.

Each file declares its own place in the theme's Section Index with a header comment:

```css
/* @section Colors / Primitives
   @kind branding */
```

`@kind` (`branding` | `foundation` | `component`) buckets the file in the token change
report; omit it and it falls back to a filename heuristic.

## Generated, and committed

- **`tokens.lock.json`** — the committed baseline of the assembled token set.
- **`TOKEN-CHANGELOG.md`** — every build's added/modified/removed tokens, newest first.

Both are written by `npm run build:theme`. **Do not edit them by hand** — commit them
alongside the token change that produced them. They exist because a design system's tokens
are its public API, and a rename that lands silently is a breaking change nobody reviewed.
