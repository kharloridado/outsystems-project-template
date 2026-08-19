# outsystems-frontend-skills

A toolkit that gives AI coding agents context and examples about OutSystems frontend development and the official UI Components.

The goal is to help any AI agent (modelAPI agents, Cursor, Claude Code, Copilot, custom agents…) build better OutSystems apps, screens, and UI by reusing the existing OutSystems framework and components — instead of generating custom HTML/CSS/JS.

## Who this is for

Two kinds of agents read these files:

- **General-purpose agents** (modelAPI mentor, code review, scaffolding) — need orientation: which pattern fits a requirement, when to reach for what, what the cross-cutting rules are. Start with the per-section READMEs.
- **Specific-task agents** (UI generators, JSON patch authors, validators) — need exact pattern signatures: argument names, types, placeholders, events, composition rules. Jump straight to the per-category files and indexes.

Both audiences are supported throughout. Files lead with quick orientation tables, then drill into per-pattern reference.

## Repository layout

```
outsystems-agents/
  SKILL.md                          ★ TOP ENTRYPOINT — load this FIRST, routes to the right stack/topic

foundations/
  outsystems-design-tokens/
    design-tokens.md                  Mobile UI design tokens catalog

ui-frameworks/
  outsystems-ui/                    UI framework for Reactive Web + Phone App Template (block-based)
    SKILL.md                          ★ ROUTER — picks the right leaf doc by task
    README.md                         Framework overview (themes, layouts, screen templates)
    blocks-index.md                   Single-page index of every block + reference enums
    widget-conventions.md             Critical widget rules (event wiring, table structure, …)
    screen-templates.md               Catalog of pre-built screens (List, Detail, Form, …)
    extensibility.md                  Extending patterns with JS — Set*Configs/Events, OSUIAPI, custom wrappers
    styles-and-utilities.md           Utility classes, color palette, spacing scale, CSS variables on :root
    patterns/
      content.md                      Accordion, Card, Tag, Tooltip, Section, …
      interaction.md                  DatePicker, Sidebar, Carousel, DropdownSearch, …
      navigation.md                   Tabs, Wizard, Breadcrumbs, Pagination, …
      numbers.md                      Badge, Counter, ProgressBar, Rating, …
      adaptive.md                     Columns2–6, DisplayOnDevice, Gallery, MasterDetail
      utilities.md                    AlignCenter, Separator, SwipeEvents, …
    recipes/                          End-to-end compositions (drop in, rename, wire up)
      popup-modal-dialogs.md          Confirmation / lookup / form popup recipes
      paginated-list-with-filters.md  Search + dropdown filter + sortable columns + pagination
      create-edit-form-screen.md      One screen for both Create and Edit modes
  mobile-ui/                        Separate Ionic+React widget framework for ODC Mobile UI Template
    SKILL.md                          ★ ROUTER — for Mobile UI tasks
    README.md                         Framework overview, widget catalog, property model

ui-components/                      Standalone Forge-style components (separate from core OS UI)
  outsystems-charts/                Column / Line / Pie / Donut / Area / Scatter / …
  outsystems-maps/                  Map + Marker (Google Maps / Bing / AWS variants)

common/                             Cross-cutting guidance
  SKILL.md                          ★ ROUTER — picks the right cross-cutting doc
  atomic-design.md                  Composition methodology — atoms / molecules / organisms / templates / pages
  css-customization.md              Where to put styles, when to override variables
  accessibility.md                  WCAG-AA rules, ARIA, focus management
  ui-performance.md                 Pagination, lazy loading, image sizing
  responsive-design.md              Breakpoints, adaptive vs responsive
  images-and-icons.md               ImageWidget, Icon, InlineSVG, UserAvatar

.claude/skills/                     Skill wrappers for Claude Code / Cursor agents
  <skill-name>/SKILL.md             YAML frontmatter + summary + link back to canonical doc
```

## Skills

Every canonical doc has YAML frontmatter (`name`, `description`) so it can be loaded as a skill by agents that support the format. Additionally, `.claude/skills/<name>/SKILL.md` wrappers expose each doc to Claude Code and Cursor under the standard path their loaders expect.

### Hierarchical entry points (token-conscious loading)

OutSystems agents are often constrained on token budget. The repo is organised so agents can load **minimal context first**, then **progressively narrow down** instead of pre-fetching everything.

```
outsystems-agents/SKILL.md          ← top entrypoint (~80 lines)
  ├── ui-frameworks/outsystems-ui/SKILL.md      ← OSUI router (~70 lines)
  │     └── ONE leaf doc (blocks-index, recipe, pattern category, …)
  ├── ui-frameworks/mobile-ui/SKILL.md          ← Mobile UI router (~50 lines)
  │     └── ONE leaf (mobile-ui README, design tokens, generated TS)
  ├── common/SKILL.md                           ← cross-cutting router (~40 lines)
  │     └── ONE concern (a11y, perf, CSS, responsive, atomic-design, images)
  └── ui-components/<charts|maps>/README.md     ← standalone Forge components
```

**Loading rule:** load the entrypoint, then ONE router, then ONE leaf. Don't pre-fetch the catalog.

### Leaf skills (load directly when the task is already specific)

When you already know what you need, you can skip the routers and load a leaf skill by name:

- **Framework orientation** — `osui-framework-overview`, `mobile-ui-framework`
- **Reference catalogs** — `osui-blocks-index`, `osui-screen-templates`, `osui-widget-conventions`, `osui-extensibility`, `osui-styles-utilities`
- **Pattern categories** — `osui-content-patterns`, `osui-interaction-patterns`, `osui-navigation-patterns`, `osui-numbers-patterns`, `osui-adaptive-patterns`, `osui-utilities-patterns`
- **Recipes** — `osui-recipe-paginated-list`, `osui-recipe-create-edit-form`, `osui-recipe-popup-dialogs`, `osui-recipes-index`
- **Components** — `outsystems-charts`, `outsystems-maps`
- **Cross-cutting** — `outsystems-accessibility`, `outsystems-css-customization`, `outsystems-ui-performance`, `outsystems-responsive-design`, `outsystems-images-icons`, `mobile-ui-design-tokens`, `atomic-design-methodology`

### Router skills (the entry points, exposed under `.claude/skills/`)

- `outsystems-agents` — top entrypoint
- `osui-router` — OutSystems UI router
- `mobile-ui-router` — Mobile UI router
- `common-router` — cross-cutting router

### Cursor users

Cursor reads from `.cursor/skills/`. To expose the same skills, symlink or copy:

```bash
ln -s .claude/skills .cursor/skills
```

(Or duplicate the directory if your environment doesn't support symlinks.)

## Reading order for agents

### Building a screen

1. [`ui-frameworks/outsystems-ui/README.md`](ui-frameworks/outsystems-ui/README.md) — orient on themes, layouts, screen templates.
2. [`ui-frameworks/outsystems-ui/screen-templates.md`](ui-frameworks/outsystems-ui/screen-templates.md) — pick a template archetype.
3. [`ui-frameworks/outsystems-ui/widget-conventions.md`](ui-frameworks/outsystems-ui/widget-conventions.md) — get the binding/event/style rules right.
4. [`ui-frameworks/outsystems-ui/blocks-index.md`](ui-frameworks/outsystems-ui/blocks-index.md) — look up specific blocks as needed.

### Picking a pattern for a requirement

1. [`ui-frameworks/outsystems-ui/blocks-index.md`](ui-frameworks/outsystems-ui/blocks-index.md) → "Quick lookup by requirement" table.
2. Open the matching category file in [`ui-frameworks/outsystems-ui/patterns/`](ui-frameworks/outsystems-ui/patterns/) for argument/placeholder details.

### Building a whole-screen composition

1. Browse [`ui-frameworks/outsystems-ui/recipes/`](ui-frameworks/outsystems-ui/recipes/) — full end-to-end recipes for paginated lists, create/edit forms, popup dialogs, and more.
2. Pair with [`ui-frameworks/outsystems-ui/screen-templates.md`](ui-frameworks/outsystems-ui/screen-templates.md) when scaffolding from a template archetype.

### Extending a pattern beyond its built-in inputs

1. [`ui-frameworks/outsystems-ui/extensibility.md`](ui-frameworks/outsystems-ui/extensibility.md) — four levels: `ExtendedClass` styling, `Set<Provider>Configs`/`Set<Provider>Event` Client Actions, direct `OutSystems.OSUI.Patterns.<X>API` JS calls, custom wrapper Blocks.

### Cross-cutting concerns

- Composition methodology (when to make a Block, where things belong) → [`common/atomic-design.md`](common/atomic-design.md).
- Theming/customizing visuals → [`foundations/outsystems-design-tokens/design-tokens.md`](foundations/outsystems-design-tokens/design-tokens.md) (Mobile UI) and [`common/css-customization.md`](common/css-customization.md).
- Accessibility → [`common/accessibility.md`](common/accessibility.md).
- Performance → [`common/ui-performance.md`](common/ui-performance.md).
- Mobile / responsive → [`common/responsive-design.md`](common/responsive-design.md). For the dedicated Ionic-based mobile-app stack, see [`ui-frameworks/mobile-ui/README.md`](ui-frameworks/mobile-ui/README.md).
- Images and icons → [`common/images-and-icons.md`](common/images-and-icons.md).

### Charts and maps

- Charts: [`ui-components/outsystems-charts/README.md`](ui-components/outsystems-charts/README.md).
- Maps: [`ui-components/outsystems-maps/README.md`](ui-components/outsystems-maps/README.md).

## Format conventions used in this repo

- **FULL PATH parameter format** for OutSystems UI block arguments — e.g. `"Card.UsePadding"`, `"Tabs.Header"`, `"Counter.Content"`. This is the format new modelAPI patches use.
- **Tables for argument / placeholder / event reference**, kept dense and scannable.
- **Minimal `IMobileBlockInstanceWidget` examples** for non-trivial blocks; full code is in the showcase / framework source.
- **"Anti-patterns" sections** — what NOT to do, often more useful than what to do.
- **Cross-links** instead of duplication — each fact lives in one place.

## Versions covered

- Primary target: **OutSystems Developer Cloud (ODC)**.
- Many patterns are identical or near-identical in **OutSystems 11** — references to O11 docs are used where the underlying pattern hasn't changed.
- Where ODC and O11 differ materially, the file says so.

## Sources

This repo synthesizes content from:

- [OutSystems Documentation — UI](https://success.outsystems.com/documentation/11/building_apps/user_interface/) (and the equivalent ODC docs).
- [OutSystems UI Showcase](https://outsystemsui.outsystems.com/) — every pattern's live preview.
- [OutSystems Charts Showcase](https://charts.outsystems.com/) — every chart type's live preview.
- [OutSystems Maps Sample](https://outsystemsui.outsystems.com/OutSystemsMapsSample/Map) — Maps block usage.
- Internal pattern reference work from `OutSystems/legacy-requirement-gaps` and `OutSystems/rd-ai-agent-lib`.

## Contributing

When adding new pattern documentation:

- Match the existing format: requirement-mapping table → arguments table → placeholders table → events table → composition rules → minimal example → accessibility/anti-patterns.
- Use FULL PATH naming for arguments and placeholders.
- Cross-link to `blocks-index.md` and `widget-conventions.md` rather than duplicating their content.
- Don't add code-style comments to the JSON examples beyond `// …` continuation markers.

When adding common guidance:

- Lead with a "top wins" or "do these first" section.
- Use a "quick checklist" at the bottom for AI consumption.
- Anti-patterns are as valuable as patterns — include them.
