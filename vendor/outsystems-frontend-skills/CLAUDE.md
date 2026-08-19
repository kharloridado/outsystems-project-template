# Design → ModelAPI Agent Bridge

Bridges design sources into specs for the OutSystems ModelAPI agent. Given a design (Figma, designmd, screenshots, or any MCP-equipped tool), extract, compose a blueprint JSON spec, and invoke the agent to produce a working OML.

## How to Run

```
/design-to-app
Design source: <Figma URL> | <web URL> | <image path>
App context: <path to context.md> (optional — existing app context including data model, themes, libs, blocks)
App name: <name>
Base OML: <path to existing OML> (optional — if building on an existing data model)
```

## OutSystems Knowledge

Detailed OutSystems UI patterns, blocks, screen templates, recipes, and widget conventions are in `.claude/skills/`. Read those when you need specifics on a block, recipe, or screen template.

## Spec Structure

The spec JSON has these top-level sections (see `.claude/templates/enriched-blueprint.json` for full schema):
- `app_chrome` — shared sidebar nav + header, defined ONCE (agent builds Menu block in Common UIFlow)
- `blocks` — reusable Web Blocks for repeating patterns (info rows, badges, timeline items, card headers) — agent creates these in Common UIFlow
- `design_system` — colors, typography, spacing, shadows, visual_rules, **`theme_extensions`** (the single source of truth for all custom CSS — see below)
- `entities` — data model (static, master, transaction)
- `screens[]` — each with `title`/`subtitle` (string props, not sections), `main_content[]` (body only), optional `popups[]`
- `main_content[]` entries are either standalone sections or `type: "group"` wrappers for Columns blocks
- `icon_mapping`, `roles`, `acceptance_checklist`

### `design_system.theme_extensions` — single source of truth for custom CSS

Every custom CSS variable AND class the app needs is declared ONCE in `design_system.theme_extensions` and emitted onto the theme StyleSheet's `:root`. Per-section `outsystems_hints.extended_class` fields reference classes BY NAME ONLY (space-separated alongside OS UI utilities) — they NEVER declare CSS rules inline.

```json
"theme_extensions": {
  "css_variables": {
    "--color-primary": "#9FE870",            // OS UI variable override (re-themes the framework)
    "--card-bg-currency": "#EDF0ED",         // app-specific new variable
    "--shadow-card": "0px 2px 8px 0px rgba(0,0,0,0.06)"
  },
  "classes": [
    { "name": "card-currency",
      "rule": "background: var(--card-bg-currency); border-radius: 16px; box-shadow: var(--shadow-card);" }
  ]
}
```

Then a section references:

```json
"outsystems_hints": {
  "block": "Card block from OutSystemsUI/Content. UsePadding=True.",
  "extended_class": "card-currency full-height"
}
```

This eliminates: per-section CSS duplication, undefined-class drift, the `!important` arms race, and class-rule duplication across screens.

## OML-Awareness Rules (apply during spec composition)

- **Entities:** Check existing OML first. Use what exists, add missing attributes, only create new entities. Never delete.
- **Theme:** Reuse/extend existing CSS variables and StyleSheet. Override values, don't replace. All overrides + new app-specific variables go in `design_system.theme_extensions.css_variables`; custom classes go in `design_system.theme_extensions.classes[]` — never inline in section hints.
- **Roles:** Use existing roles if they match. Only create new if needed.
- **Screens:** Modify existing screens, don't recreate.
- **Auth:** Use `IsAnonymous=false`. NEVER add `eSpace.RegisteredRole` (corrupts OML).

## Sanitization Rules

- Names → Demo*, emails → demo@example.test, financial brands → NetworkAlpha/Beta
- No PII clusters (3+ items in same field)

## Spec Composition Rules (CRITICAL)

### Values — use EXACT from design extraction, never generalize

| Mistake | Example | Rule |
|---|---|---|
| Generalizing component colors | Card bg `#EDF0ED` written as `#FFFFFF` | Use the EXACT hex from extraction, map to nearest OS variable (e.g., `--color-neutral-1`) |
| Assuming primary color for active states | Active tab shown as green when design shows black | Use the extracted active state color, not the accent |
| Rounding pixel sizes | Icon 56px written as 48px | Copy exact px values from extraction |
| Missing shadows | Shadow `0 2px 8px rgba(0,0,0,0.06)` not in spec | Copy every shadow, map to OS tokens (`--shadow-s`, `--shadow-m`) where they match |
| Inventing values not in extraction | Adding colors/sizes that don't appear in the design | Every value must trace to the extracted design |

### Layout — capture positioning, use OS utility classes

| Mistake | Example | Rule |
|---|---|---|
| Missing layout/positioning | Spec says "4-column gallery" but omits gap, padding, alignment | Capture `direction`, `gap`, `padding`, `justify`, `align` per section |
| Wrong element placement | Heading and link in "same section" but not "same row, space-between" | Use `display-flex justify-content-space-between align-items-center` |
| Missing container widths | Sidebar says "narrow" instead of exact 280px | Copy exact widths from extraction |

### Spec format — how to describe elements

| Mistake | Example | Rule |
|---|---|---|
| OS-style bindings in spec | `"GetAccounts.List.Current.CurrencyAccount.Balance"` | Use natural language: `"the account balance amount"` |
| Static prefix on labels | `"binding": "static 'Send money'"` | `"label": "Send money"` |
| Using "binding" for everything | `"binding": "the account balance"` | `"data": "the account balance"` for dynamic, `"label"` for static |
| Missing action on interactive elements | Button/link/tab/arrow has no `"action"` property | Every clickable element must have `"action": "what happens on click"` |
| Vague action description | `"action": "scroll cards left"` | Describe full behavior: "Show previous 4 accounts. Disabled when on first page. Right arrow disabled when no more accounts." |
| Layout justify not applied | Spec says `justify: space-between` but agent puts items adjacent | In outsystems_hints, explicitly state: "The OUTER container must have CSS class 'display-flex justify-content-between'. Child A is left-aligned, Child B is right-aligned." Name the containers. |
| Amount column not right-aligned | Transaction amounts appear next to name instead of far right | In the row layout, the text column must be `flex-1` (takes remaining space) and the amount column must be `shrink-0` aligned to end |
| Structured conditional rendering | `"paused": "bg #D4A117, icon ⏸"` | Write as narrative: "When StatusId is Paused, background is #D4A117 and icon is '⏸' in white 16px Bold" |
| Double text on buttons/links | Agent creates "Button" + "Send money" | REPLACE default placeholder text with the label — content should have ONLY the label |
| Charts missing from implementation | Design has a chart but agent skips it | Add chart section with block name (e.g., OutSystemsCharts.ColumnChart), data entity, series, colors, axis labels. Add explicit acceptance_checklist item for the chart. |
| Spec'd `Tabs` block when there's no content-panel swap | A pill row sits above a card grid; selecting one doesn't swap a panel, it just filters the cards | These are FILTER PILLS on a filterable card row, not `Tabs`. `Tabs` materializes an empty Content placeholder as a giant "Click to add Content" box and is only correct when each option owns a distinct content region directly underneath. For a filter-pills-over-cards pattern, don't hand-roll two `IButton`s with custom `tab-pill-active`/`-inactive` CSS — use a `List` of filter `ILink`s/`Tag` chips above the card grid and a `Pagination` block for prev/next arrows (both theme-aware, with built-in disabled states). The [`recipes/gallery-with-filters.md`](ui-frameworks/outsystems-ui/recipes/gallery-with-filters.md) recipe shows the full search + category + price-range version; for simpler cases (one filter, no search, no range slider), borrow only the filter-Link + card-grid + `Pagination` spine — the full recipe's two-aggregate, six-local-var, two-action machinery is overkill and won't fit smaller designs out of the box. |
| Spec'd two `IButton`s with custom `arrow-btn-active`/`arrow-btn-inactive` CSS for prev/next | Pagination arrows hand-rolled as `IButton` widgets with !important background colors and border-radius CSS | Use the `Pagination` block from `OutSystemsUI/Navigation`. Replace the default Previous/Next children with `IIcon` (Phosphor `caret-left` / `caret-right`, weight=fill). The block handles disabled states (first/last page), accessibility, OnNavigate event, and theming. Hand-rolled arrow buttons lose all of that and create a `!important` arms race with block defaults. See [`recipes/gallery-with-filters.md`](ui-frameworks/outsystems-ui/recipes/gallery-with-filters.md) step 10c for the canonical wiring. |
| Spec'd `Columns4` + 4 hand-placed `Card` blocks for a responsive card grid | 4-up currency cards using Columns4 with one Card per column | Use the `Gallery` block from `OutSystemsUI/Adaptive`. Set `RowItemsDesktop=4 / RowItemsTablet=2 / RowItemsPhone=1` (tune per content density). Put a `List` inside `Gallery.Content`; each row is one Card. `Columns4` is the right answer for FIXED heterogeneous columns (e.g., sidebar + main + aside) — NOT for a uniform N-card grid that should reflow on smaller screens. Tell-tale: if every column holds the same shape of content with the same data binding pattern, it's a Gallery. |
| Visual component described as raw CSS | `content` says "Horizontal bar, 8px height, colored fill" or "SVG circle with dasharray" — agent builds a div/SVG | Name the OutSystems block in BOTH `content[].data` AND `outsystems_hints.block`: `ProgressBar`, `ProgressCircle`, `Counter`, `Rating`, `Badge`, `OutSystemsCharts.*`. The agent reads `content` first — if it says "Container" there, it creates a Container even if `outsystems_hints` says otherwise. |
| Inline CSS rules in per-section `outsystems_hints.css_classes` | `"css_classes": ".card-currency { background:#EDF0ED; ... } .flag-gbp { background:#002470; ... }"` repeated across 4 currency-card sections | Declare each class ONCE in `design_system.theme_extensions.classes[]` (with `name` + `rule`). Sections reference by name only via `outsystems_hints.extended_class: "card-currency full-height"`. Per-section inline rules duplicate the CSS, drift between siblings, and balloon the theme StyleSheet. The agent should emit `theme_extensions` as a single `:root` + class list onto the theme; nothing else writes CSS. |
| Fat custom class duplicating what OS UI utilities already provide | `.flag-gbp { background:#002470; border:2px solid #E5E5E8; width:56px; height:56px; border-radius:28px; display:flex; align-items:center; justify-content:center; }` | UTILITIES FIRST. Before adding a class rule, check `styles-and-utilities.md` for utility-class coverage. The example above expresses 5 of 7 properties via utilities — refactor to `extended_class: "display-flex align-items-center justify-content-center border-radius-circle flag-gbp"` + a thin class with just `background: #002470; border: 2px solid var(--color-neutral-3); width: 56px; height: 56px;`. A custom class is justified ONLY when (a) the property has no utility equivalent (gradient, animation, clip-path, transform), or (b) the value falls outside the utility scale (e.g., border-radius: 16px isn't soft=4px / rounded=100px / circle=50%). Even when justified, the class body should be MINIMAL — every property expressible as a utility goes on `extended_class` alongside the class name, NOT into the class rule. |
| Hardcoded hex / px inside a class rule | `"rule": "background: #EDF0ED; box-shadow: 0px 2px 8px 0px rgba(0,0,0,0.06);"` | Declare the value as a variable in `theme_extensions.css_variables` (`--card-bg-currency`, `--shadow-card`), then reference via `var(--...)` in the class rule. If the same hex/px appears in 2+ class rules, it MUST be a variable. |
| `!important` arms race in class rules | Every property in `.arrow-btn-active` carries `!important` because the IButton block's default styles win otherwise | Stop fighting the cascade. The right answer is either (a) use the block's argument that controls the property natively (e.g., Button's variant arg sets color — don't override via `!important`), or (b) swap to a block that supports the visual treatment without CSS overrides (e.g., `Pagination` instead of hand-styled IButtons for prev/next). If you're writing `!important` on 3+ properties of one class, the underlying widget is wrong — go back to block selection, not more CSS. |
| `extended_class` references an undefined class name | Spec writes `"extended_class": "tab-pill-active"` but never declares `tab-pill-active` in `theme_extensions.classes[]` | Every token in `extended_class` MUST be either a known OS UI utility (`display-flex`, `column-gap-s`, `margin-top-l`, `full-height`, …) OR an entry in `theme_extensions.classes[].name`. Undefined refs are silent no-ops — the widget renders default-styled and the visual treatment never appears. Validate by enumerating every `extended_class` token in the spec and confirming it traces to one of the two sources. |

## Key Paths

| Path | Purpose |
|---|---|
| `oml/initial.oml` | Default starting OML |
| `output/<app>/context.md` | Per-app context (data model, themes, libs, blocks) for incremental spec generation |
| `.claude/skills/agent-cli.md` | CLI usage for `rd-ai-dotnet-cli` |
| `.claude/skills/` | Full OutSystems UI pattern/block/recipe/screen template docs |
| `.claude/templates/enriched-blueprint.json` | Blueprint JSON schema reference |
| `logs/` | Per-run timing + agent logs |
