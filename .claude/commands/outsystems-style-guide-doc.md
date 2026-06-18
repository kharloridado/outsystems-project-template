---
name: outsystems-style-guide-doc
description: Generate Live Style Guide documentation pages for OutSystems components — including OutSystems UI customizations, custom Blocks, and Web Components with their Block wrappers. Use this skill whenever the user needs to document a component, update the Live Style Guide, write a component spec page, or create token specimens for the OutSystems Style Guide module.
---

# OutSystems Style Guide Documentation Generator

Produce structured documentation pages for the Live Style Guide — the single source of truth between design and engineering.

## Pre-flight

1. Check memory for "OutSystems convention:" entries. If missing → invoke `outsystems-onboarding` first.
2. Use stored prefix and environment.

## When to use

- User says "document this", "add to Style Guide", "create a spec page"
- User just finished building a new component (Phase 4 of the workflow)
- User updated `:root` tokens and needs swatches/specimens refreshed
- User asks for a component handoff doc

## Three document types

### A. Token Specimen Page (for new/updated tokens)

Generate a page showing:

**Colors:** Swatch grid with hex + token name + WCAG contrast ratios. Usage guidance.

**Typography:** Type scale ladder. Each size rendered with token name, computed px, line-height, weight. Heading + body pairings.

**Spacing:** Visual scale (boxes sized to each `--space-*` value). Base unit annotation.

**Shape & Elevation:** Border-radius samples. Shadow ladder. Border thickness examples.

### B. Component Spec Page (for OS UI customizations or custom Blocks)

Standard structure (use this template):

```markdown
# [Component Name]

**Pattern Type:** [OS UI Customization / Custom Block / Web Component + Block]
**Base Pattern:** [e.g., Card, Tabs, or "N/A — Web Component"]
**BEM Block / Tag:** `.acme-{block}` or `<acme-{tag}>`
**Location:** [Theme CSS / Block CSS / Patterns Library]
**Escalation Level:** [L1–L5]
**Status:** [Draft / Approved / Deprecated]

## Purpose
[One sentence: what this does and when to use it]

## Visual States
| State | Modifier Class | Visual |
|---|---|---|
| Default | — | (screenshot) |
| Hover | `:hover` | (screenshot) |
| Focused | `:focus-visible` | (screenshot) |
| Active | `--is-active` | (screenshot) |
| Disabled | `[aria-disabled="true"]` | (screenshot) |
| Loading | `--is-loading` | (screenshot) |
| Error | `--has-error` | (screenshot) |

## Variants (Modifiers)
| Modifier | Class | Use Case |
|---|---|---|
| Featured | `.acme-card--featured` | Promotional cards |
| Compact | `.acme-card--compact` | Dense list contexts |

## Anatomy
[Annotated diagram showing BEM class for each element]

## ExtendedClass Usage
\`\`\`
ExtendedClass = "acme-card acme-card--featured"
\`\`\`

## Tokens Consumed
- `--color-neutral-9` (text)
- `--color-primary` (link/CTA)
- `--space-m` (padding)
- `--border-radius-soft` (corners)
- `--shadow-s` (resting), `--shadow-m` (hover)

## Responsive
- Mobile (<768px): single column, `--space-m` padding
- Tablet (≥768px): two-column grid, `--space-l` padding
- Desktop (≥992px): three-column grid

## Accessibility
- Keyboard focusable
- Focus ring uses `:focus-visible` + `--color-primary`
- WCAG AA contrast (4.5:1)
- Interactive root uses semantic HTML

## Do / Don't
✅ Do: ...
❌ Don't: ...

## Code Example
[HTML snippet showing OutSystems usage]

## Changelog
- 2026-05-11 — v1.0 — Initial release
```

### C. Web Component Spec Page (for L5 components — additional sections)

For Web Components, add these sections beyond the standard spec:

```markdown
## Web Component API

### Tag Name
`<acme-{component-name}>`

### Attributes
| Attribute | Type | Default | Description |
|---|---|---|---|
| value | string | "" | Current value |
| disabled | boolean | false | Disables interaction |
| size | "sm" \| "md" \| "lg" | "md" | Size variant |

### Properties (JavaScript)
| Property | Type | Description |
|---|---|---|
| items | Array | Complex data; set via JS in OnReady |

### Events
| Event | Detail Payload | Description |
|---|---|---|
| change | `{ value }` | Value changed |
| submit | `{ values, isValid }` | Form submitted |

### Slots
| Slot Name | Purpose |
|---|---|
| (default) | Body content |
| header | Header content |
| footer | Footer content |

## OutSystems Block Wrapper

### Block: `{ComponentName}` (in Patterns Library)

**Input Parameters:**
| Name | Type | Mandatory | Default |
|---|---|---|---|
| Value | Text | No | "" |
| Disabled | Boolean | No | False |

**Block Events:**
| Name | Parameters |
|---|---|
| OnChange | NewValue (Text) |

**Block Placeholders:**
| Name | Maps to Slot |
|---|---|
| HeaderContent | slot="header" |
| BodyContent | (default) |
| FooterContent | slot="footer" |

## Installation
1. Add `acme-{component-name}.js` to Theme module Scripts
2. Reference in base Layout's RequireScript
3. Create the wrapper Block in Patterns Library
4. Use the Block from Toolbox in feature apps
5. Validate in browser (1-Click Publish → F6) — Service Studio Preview won't render Web Components
```

## Output guidance

- Generate markdown directly — user pastes into Style Guide screen or converts to OutSystems content
- For Web Components, always include the Block wrapper docs (the user's standard)
- If the user is building the Style Guide page as an OutSystems screen, provide a Block structure suggestion

## Reference

- `references/style-guide-template.md` — Reusable Style Guide module structure
- `references/component-doc-checklist.md` — Pre-publish checklist
