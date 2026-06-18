---
name: outsystems-git-helpers
description: Generate Git-compatible artifacts for OutSystems frontend work — commit messages, branch names, PR descriptions, .gitignore entries, and CHANGELOG entries — following conventional commits and the user's stored project context. Use this skill whenever the user asks for commit messages, branch names, PR descriptions, or anything related to versioning generated components. Designed for hybrid workflow: generate here in Claude.ai, commit via Claude Code or your IDE.
---

# Git Workflow Helpers

This skill makes Claude.ai output ready to commit. It doesn't directly interact with Git or GitHub — that's done in Claude Code or your IDE. It generates the metadata around your commits.

## When to use

- User asks for a commit message
- User asks for a branch name
- User asks for a PR description
- User says "ready to commit" / "make a PR" / "set up the branch"
- After generating any significant artifact (component, tokens, Style Guide page) — proactively offer Git artifacts

## Pre-flight

Check memory for:
- `OutSystems convention: prefix = "..."` (for naming consistency)
- `OutSystems project: customer = "..."` (for commit scope)
- `OutSystems project: name = "..."` (for commit scope)

If missing, project context isn't critical for this skill — proceed with sensible defaults.

## Conventional Commits format

Use the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type vocabulary for OutSystems frontend work

| Type | Use For |
|---|---|
| `feat` | New component, new token, new pattern |
| `fix` | Bug fix in CSS, Web Component, or Block |
| `style` | Visual changes only (no behavior change) |
| `refactor` | Internal restructure (no visible change) |
| `docs` | Style Guide entry, README updates |
| `chore` | Tooling, configuration, dependencies |
| `a11y` | Accessibility improvement (not standard Conventional Commits, but useful) |
| `perf` | Performance improvement |
| `test` | Add/update tests |

### Scope vocabulary

| Scope | Use For |
|---|---|
| `theme` | Theme module / Theme Library CSS |
| `tokens` | `:root` design tokens |
| `card`, `button`, `modal`, etc. | Specific component |
| `wc/{name}` | Web Component (e.g., `wc/pricing-toggle`) |
| `block/{name}` | OutSystems Block (e.g., `block/PricingToggle`) |
| `style-guide` | Style Guide module |

### Examples

```
feat(tokens): add accent color and 2xl shadow to support hero variant

Added --color-accent: #FF6B35 and --shadow-2xl: 0 24px 48px rgba(0,0,0,0.18)
to support the new hero design from Figma file ABC123.

Style Guide: updated Foundations/Colors swatch page.

Refs: ACME-123
```

```
feat(wc/pricing-toggle): add Web Component for monthly/annual toggle

- Vanilla JS Web Component with Shadow DOM
- BEM internal classes scoped to component
- Exposes --color-primary, --space-*, --font-* for theming
- Keyboard navigation: Arrow keys, Home, End
- WCAG 2.2 AA compliant: 4.78:1 contrast, focus indicators, 44px targets

Block wrapper specs in: docs/blocks/PricingToggle.md

Closes: ACME-145
```

```
a11y(card): improve focus indicator contrast on dark backgrounds

Previous: outline used --color-primary which had 2.3:1 contrast on --color-neutral-9
Now: uses --color-neutral-0 with --shadow-focus for 12:1 contrast

Validates WCAG 2.2 SC 1.4.11 (Non-text Contrast)
```

## Branch naming convention

```
<type>/<scope>-<short-description>
```

Examples:
- `feat/tokens-hero-support`
- `feat/wc-pricing-toggle`
- `fix/card-focus-on-dark`
- `a11y/modal-focus-trap`
- `refactor/btn-bem-cleanup`

Keep under 50 characters. No spaces or special characters (use hyphens).

## PR description template

When asked for a PR description, generate:

```markdown
## Summary

[1-2 sentence overview of what this PR does]

## Changes

- [Bullet list of specific changes]
- [Component A: what changed and why]
- [Token X: added/modified/removed]

## Design source

- Figma: [URL or file reference if applicable]
- Design tokens: [Updated which]

## Style Guide

- [ ] Updated relevant Style Guide pages
- [ ] Token specimens current
- [ ] Component documentation added/updated

## Accessibility (WCAG 2.2 AA)

- [ ] Color contrast validated (ratios in CSS comments)
- [ ] Focus indicators visible and meet 3:1 contrast
- [ ] Touch targets ≥ 24×24 CSS pixels
- [ ] Keyboard navigation tested
- [ ] Semantic HTML used / ARIA where needed
- [ ] `prefers-reduced-motion` respected for animations

## Testing

- [ ] 1-Click Published to dev environment
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Tested at all breakpoints (phone, tablet, desktop)
- [ ] [For Web Components] Browser console clean, no warnings

## Breaking changes

[List any breaking changes, or "None"]

## Notes for reviewers

[Anything specific the reviewer should look at]

---

**Customer:** [from project context]
**Project:** [from project context]
**Refs:** [Ticket numbers if applicable]
```

## .gitignore for OutSystems frontend repos

Standard entries for a repo storing the skills package + generated artifacts:

```gitignore
# OS / Editor
.DS_Store
Thumbs.db
*.swp
.idea/
.vscode/
*.sublime-*

# Node / build
node_modules/
dist/
.cache/
*.log

# OutSystems-specific (oml/odc binaries shouldn't be in source control typically)
*.oml
*.osp
*.osa
*.oap

# Service Studio temp files
~$*

# Local secrets / configs
.env
.env.local
*.local.json

# Test outputs
test-results/
playwright-report/
coverage/
```

## CHANGELOG entry format

Use Keep a Changelog format:

```markdown
## [1.2.0] - 2026-05-12

### Added
- New `acme-pricing-toggle` Web Component with monthly/annual selection
- `--color-accent` token for hero variants
- `--shadow-2xl` for elevated cards

### Changed
- Card focus indicator now uses 2px outline (was 1px)
- Button primary background darkened from #2563EB to #1A73E8 for AA contrast

### Fixed
- Modal focus trap now correctly restores focus on close
- Carousel keyboard navigation respects RTL languages

### Accessibility
- All form components now meet WCAG 2.2 SC 2.5.8 (target size)
- Modal dialog gains aria-modal and inert background

### Deprecated
- `.acme-card--shadow-large` (use `--shadow-l` token via inline ExtendedClass instead)
```

## Suggesting commits for generated content

After generating any artifact (component, tokens, doc), proactively suggest the commit:

> "Here's the suggested commit when you're ready:
>
> ```
> feat(tokens): update brand colors for v2.1 redesign
>
> Updated --color-primary to #7C3AED and --color-secondary to #EC4899
> per new brand guidelines (Figma file XYZ).
>
> Contrast validated:
> - primary on neutral-0: 5.2:1 ✓ AA
> - neutral-0 on primary: 5.2:1 ✓ AA
>
> Style Guide: updated Foundations/Colors page.
> ```
>
> Branch suggestion: `feat/tokens-v2-1-redesign`"

The user can copy this directly into Claude Code or their terminal.

## For users with GitHub MCP later

If GitHub MCP becomes available, the same patterns work — Claude can call `Github:create_branch`, `Github:commit_files`, `Github:create_pull_request` using the generated commit messages and PR descriptions.

For now (Claude.ai), generate the text; commit via Claude Code or terminal.
