Generate an OutSystems app spec from a design source, then invoke the ModelAPI agent.

## OutSystems Knowledge + Figma Extraction (run in parallel)

Load skills AND start Figma extraction simultaneously — they are independent. In a single message, launch ALL of these tool calls together:

```
Parallel group A (Figma extraction — start immediately, don't wait for skills):
  get_screenshot(nodeId)
  get_variable_defs(nodeId)
  get_design_context(nodeId)

Parallel group B (skill loading — runs at the same time as Figma):
  .claude/skills/INDEX.md
  .claude/skills/SKILL.md
  .claude/skills/ui-frameworks/outsystems-ui/SKILL.md
  .claude/skills/ui-frameworks/outsystems-ui/layouts.md
  .claude/skills/ui-frameworks/outsystems-ui/structural-skeleton.md
  .claude/skills/ui-frameworks/outsystems-ui/blocks-index.md
  .claude/skills/ui-frameworks/outsystems-ui/widget-conventions.md
  .claude/skills/ui-frameworks/outsystems-ui/styles-and-utilities.md
  .claude/skills/ui-frameworks/outsystems-ui/polish-checklist.md
  .claude/skills/ui-frameworks/outsystems-ui/patterns/adaptive.md
  .claude/skills/ui-frameworks/outsystems-ui/patterns/navigation.md
  .claude/skills/ui-frameworks/outsystems-ui/patterns/content.md
  .claude/skills/ui-frameworks/outsystems-ui/patterns/numbers.md
```

After this parallel batch completes, proceed with Figma Phase 2-3 (parse metadata, batch child node calls) — the skills are already loaded.

```
Read on demand (check INDEX.md for paths, load when the design matches):
  ui-components/outsystems-charts/README.md          → when design has charts (bar, line, pie, area, donut)
  ui-frameworks/outsystems-ui/patterns/interaction.md → when design has Carousel, Sidebar, DatePicker, Dropdown
  ui-frameworks/outsystems-ui/patterns/utilities.md   → AlignCenter, Separator, gestures
  ui-frameworks/outsystems-ui/recipes/README.md       → recipes index — pick the matching one
  ui-frameworks/outsystems-ui/extensibility.md        → JS API, custom events, wrapper blocks
  references/design-system.md                         → theme tokens, brand recolor, palette swap
  references/component-selection.md                   → picking the right block per requirement
  references/states-and-feedback.md                   → empty/loading/error states, toasts
  references/<archetype>.md                           → dashboard | list-table | detail-view | edit-form |
                                                        master-detail | gallery-grid | kanban | timeline |
                                                        calendar | wizard | map-view | inbox-notifications |
                                                        settings  (load the one matching the screen)
```

Screen-level recipes — load the matching one BEFORE writing widget JSON:

```
ui-frameworks/outsystems-ui/recipes/paginated-list-with-filters.md
ui-frameworks/outsystems-ui/recipes/create-edit-form-screen.md
ui-frameworks/outsystems-ui/recipes/popup-modal-dialogs.md
ui-frameworks/outsystems-ui/recipes/columns-and-cards-dashboard.md
ui-frameworks/outsystems-ui/recipes/gallery-with-filters.md
```

Block-level recipes — load when the request matches the trigger:

```
recipes/horizontal-card-carousel.md   → horizontally scrollable cards / currency cards row / carousel
recipes/tab-switcher.md               → tabs / segmented switcher / All / Active / Archived
recipes/sidebar-navigation.md         → persistent left sidebar with nav items
recipes/info-banner.md                → info banner / promo / status notice
recipes/buttons-and-clickables.md     → buttons, CTAs, "See all" links, icon-only action buttons
recipes/button-with-icon.md           → button with leading or trailing icon
recipes/avatar-and-icon-badge.md      → user avatar + bell-with-count notifications
recipes/transaction-list.md           → activity feed / data-driven row list with IList + ListItemContent
recipes/kpi-counters.md               → big number + label, balance cards, dashboard counters
recipes/kpi-card-with-trend.md        → KPI + trend pill (+Y% vs last month)
recipes/progress-card.md              → spending limit / quota / goal with a progress bar
recipes/sparkline-card.md             → KPI + inline area/line chart, "last 7 days"
recipes/chart-card.md                 → donut/pie/bar chart with legend
```

Use the loaded knowledge to:
- Apply the **semantic widget hierarchy** from `ui-frameworks/outsystems-ui/SKILL.md`: OS UI block → `AdvancedHtml` with semantic HTML5 tag → platform interactive widget → `Container` (last resort only). Never style a `Container` to LOOK like a card/button/banner — use the matching block.
- Pick the correct **Layout block** (LayoutSideMenu, LayoutTopMenu, LayoutBlank) and DELETE the default `LayoutTopMenu` that `CreateScreen` ships with before adding your chosen one.
- Sketch the **structural skeleton** (Columns + Cards tree) and commit a **block inventory** ("this region → that block") BEFORE writing any widget JSON.
- Map design elements to the correct **OutSystems blocks** (Gallery, Card, Tabs, Wizard, ProgressBar, ProgressCircle, OutSystemsCharts, Counter, UserAvatar, IconBadge, Tag, Alert) with proper arguments.
- Follow **widget conventions** (block arguments use FULL PATH `<SourceBlock>.<Name>`, `Arguments: []` + `PlaceholdersContent: []` always emitted, `content` vs `Widgets` casing, expression paths).
- Run the **polish checklist** as the mandatory final pass — strip block default children, apply typography hierarchy, use brand color sparingly, populate with realistic placeholder content.

CLAUDE.md has the spec composition quality rules (exact values, layout capture, natural language bindings). The skills have the OutSystems implementation knowledge. Both are needed.

## Setup

```bash
RUN_ID="$(date +%Y%m%d-%H%M%S)"
LOG_DIR="logs/${RUN_ID}"
mkdir -p "$LOG_DIR"
echo "[$(date +%H:%M:%S)] Pipeline started" > "$LOG_DIR/timing.log"
```

## Input

Ask the user for:
1. **Design source** (required) — Figma URL, web URL, image path (screenshot/mockup), or text description
2. **App context** (optional) — path to a context.md describing the existing app state (data model, themes, CSS variables, referenced libs, blocks). The spec should reference existing elements by name, not recreate them.
3. **App name** (optional)
4. **Base OML** (optional) — path to an existing OML to build on (e.g., one with entities already created)

## Figma Extraction Strategy

Phase 1 calls (screenshot, variable_defs, get_design_context) are already launched in the parallel group above. If the root `get_design_context` returns metadata XML (common for complex screens), parse child node IDs and call `get_design_context` on significant children — filter to `<frame>` tags wider than 100px and taller than 50px, skip decorative nodes (vectors, masks, lines). Batch child calls in **pairs of 2** (4+ concurrent calls cause timeouts). If a child call fails, skip it — screenshot + metadata + variable_defs are sufficient. If `get_variable_defs` returns empty, extract colors from the design context code.

---

## Web URL Extraction Strategy

Use `curl -s -L` to fetch the HTML, then discover and fetch CSS and JS bundles referenced in it. SPAs render client-side — the HTML shell is empty, the JS bundles contain the actual UI (routes, components, embedded HTML templates). Extract design tokens from CSS (`:root` variables, class definitions) and screen structure from JS (route list, component code, entity names).

## Image Extraction Strategy

Read the image directly — Claude can analyze screenshots visually. Hex values may need approximation; note uncertainty in the extraction log.

---

## Stage 1: Extract & Compose spec.json

Do this in ONE pass. You already have OutSystems context loaded from the skills (batch 1+2 above). Apply it directly during composition.

1. **Extract** — follow the Figma Extraction Strategy above. Use `get_variable_defs` output for design tokens. If an **App context** file is provided, read it to understand existing entities, themes, CSS variables, and blocks — reference them by name, do NOT recreate them. If a **Base OML** is provided, use it instead of `oml/initial.oml` in Stage 2.

2. **Compose with OutSystems enrichment** — write `output/<app-name>/spec.json` using CLAUDE.md rules AND the OutSystems skills loaded above.

   **Entities — context-dependent:**
   - **When App context or Base OML is provided:** The agent already has access to existing entities, themes, and blocks — just refer to them by name in your spec, do not re-list them. Only include entities in the spec if they are NEW (not already in the context/OML). Reuse existing theme CSS variables and custom classes. Reference existing blocks by name.
   - **When NO context is provided:** Infer all required entities from the design — identify data shown in the UI (lists, cards, forms, dropdowns), derive entities with attributes and relationships. Do NOT include seed data — just define the entity structure. The agent creates the data model, not sample records.

   **Keep the spec lean — avoid redundancy:**
   - Do NOT include seed data — the agent implements structure, not sample records
   - Do NOT repeat entity attributes, theme overrides, or blocks that are already in the context.md or base OML
   - Do NOT add `component_anatomies` (redundant with sections — sections have all the detail)
   - Do NOT paste full CSS rule definitions inside `outsystems_hints` (agent derives CSS from design_system tokens — just list class names)
   - Do NOT add a separate `interactions` list (each element already has its `action` property inline)
   - In `visual_rules`, only keep rules that add context beyond what tokens already say (e.g., "active tab is BLACK not green")

   **The spec JSON should have:** `name`, `description`, `primary_color`, `app_chrome` (sidebar nav groups + header content — defined once, shared across all authenticated screens), `blocks` (reusable Web Blocks for repeating UI patterns — info rows, badges, timeline items, card headers), `design_system` (colors, typography, spacing, radius, shadows, visual_rules, css_architecture), `entities` (only if NEW entities are needed), `screens` (each with `title`, `subtitle`, `main_content[]` for body sections, optional `popups[]`), `icon_mapping`, `roles`, `acceptance_checklist`. Apply OML-awareness rules during composition. See `.claude/templates/enriched-blueprint.json` for the full schema.

   Apply OutSystems knowledge during composition (not as a separate pass):
   - **App chrome** (`app_chrome`): Define sidebar and header ONCE at the top level. The agent builds a shared Menu block from this. Sidebar has structured `nav_groups[]` with items pointing to screen names. Header has search, notifications, and user profile. Login/LayoutBlank screens set `layout_override` and skip app_chrome.
   - **Reusable blocks** (`blocks`): Only define blocks for patterns that appear on **multiple screens** (e.g., info rows used on both Detail and Edit screens, status badges on both List and Detail). Do NOT create blocks for components used on a single screen — those should be inline widgets within the screen's `main_content`. The agent creates blocks in Common UIFlow, so single-screen components as blocks add unnecessary overhead.
   - **Screen title/subtitle**: Set as simple string properties on the screen (`"title": "Command Center"`). They go in the Title placeholder. NEVER describe the title as a section in `main_content` — it renders twice.
   - **`main_content[]` only**: Screen sections contain ONLY MainContent body (hero, cards, lists, forms). No sidebar, header, or title sections.
   - **Section groups** (`type: "group"`): When sections sit side-by-side (KPI cards in Columns3, Activity+Storage in ColumnsMediumLeft), wrap them in a group that specifies `columns`, `columns_config`, and `margin_bottom`. Items inside the group have a `column` number.
   - **Vertical spacing**: Every entry in `main_content[]` (standalone section or group) MUST have `margin_bottom`. The agent does not add gaps automatically.
   - **Acceptance checklist**: Always end the checklist with a "VERIFICATION GATE" item instructing the agent to read the app state after implementation and verify every checklist item. Without this, the agent may skip items. Each checklist item should be specific and verifiable (exact counts, block names, CSS class names).
   - **Popups**: Overlays go in the screen's `popups[]` array, not in `main_content`. Each popup has a trigger, style, and content.
   - **Block mapping**: For each UI component, set `outsystems_hints.block` to the correct OutSystems block name with arguments (e.g., `Gallery` with `RowItemsDesktop=4`, `Card`, `Tag`, `Tabs`)
   - **Source layer naming IS the block selector (non-negotiable)**: When a Figma frame, layer, or design region carries a name like `Carousel` / `Carrousel` / `Slider` / `Gallery` / `Tabs` / `Wizard` / `Accordion` / `Sidebar` / `Stepper`, that name is the **primary signal of designer intent** — spec the region as the matching OS UI block (and its recipe), **even when the captured viewport happens to show every item statically**. Concrete rules:
       - Source name contains `Carousel` / `Carrousel` / `Slider` → `Carousel` block via [`horizontal-card-carousel`](.claude/skills/ui-frameworks/outsystems-ui/recipes/horizontal-card-carousel.md). Do **NOT** substitute `Columns3` / `Columns4` because a 1600px screenshot shows all 3 cards side-by-side — the carousel chrome (arrows, dots, swipe) is part of the design's intent and Columns can't gain that chrome. Tripwire: if the source XML has a layer literally called `Cards Carrousel` / `Carousel` / `Slider` and your spec writes `"columns": "Columns3"` for it, you're wrong — re-spec as `Carousel`.
       - Source name is `Gallery` / `Grid` AND items are uniformly shaped → `Gallery` block.
       - Source name contains `Tabs` / `Tab Bar` / `Segmented` with one content panel per option → `Tabs` block.
       - Source name contains `Wizard` / `Steps` / `Stepper` → `Wizard` block.
       - Source name contains `Accordion` / `Collapsible` / `FAQ` → `Accordion` block.
       - Source name contains `Sidebar` / `Drawer` (right-side persistent panel) → `Sidebar` block with `StartsOpen=True`.
     The "Cards Carrousel" → `Columns3` swap is the canonical regression to catch — when in doubt between Carousel and Columns, prefer Carousel; it degrades visually to a row but Columns can never gain swipe/arrow chrome retroactively.
   - **Screen archetype**: Set `screens[].template` to the matching reference archetype from `references/` (`dashboard`, `list-table`, `detail-view`, `edit-form`, `master-detail`, `gallery-grid`, `kanban`, `timeline`, `calendar`, `wizard`, `map-view`, `inbox-notifications`, `settings`). The agent loads the matching reference doc when building the screen.
   - **Recipe patterns**: If the screen or a sub-region matches a recipe in `ui-frameworks/outsystems-ui/recipes/`, embed the recipe pattern. Screen-level recipes: `paginated-list-with-filters`, `create-edit-form-screen`, `popup-modal-dialogs`, `columns-and-cards-dashboard`, `gallery-with-filters`. Block-level: `transaction-list`, `tab-switcher`, `horizontal-card-carousel`, `sidebar-navigation`, `avatar-and-icon-badge`, `kpi-counters`, `progress-card`, `sparkline-card`, `chart-card`, `info-banner`, `buttons-and-clickables`, `button-with-icon`, `kpi-card-with-trend`.
   - **CSS architecture**: Override OS UI CSS variables (`--color-primary`, `--color-neutral-*`, `--color-background-body`, `--color-text-primary`) on the THEME's StyleSheet — never invent new variable names scoped to wrapper classes. Use `Style` with OS utility classes (`display-flex`, `padding-l`, `margin-top-xl`, `shadow-s`, `border-radius-soft`) and `ExtendedClass` on blocks for scoped overrides. See `ui-frameworks/outsystems-ui/styles-and-utilities.md`.
   - **Charts**: When the design contains any chart (bar, column, line, pie, donut, area), the spec MUST include a detailed chart section with: the chart type (e.g., `OutSystemsCharts.ColumnChart`), the data entity and attributes for the data points, series names and colors, axis labels, and how the data is converted (e.g., `ConvertList` from aggregate to DataPoints). Add a specific acceptance_checklist item: "Chart [type] is implemented using OutSystemsCharts.[Block] with data bound to [entity] aggregate, [N] series, with correct colors and axis labels." The agent often skips charts — the acceptance checklist forces it to verify.
   - **Progress, number & chart visualizations (CRITICAL — often missed)**: When the design contains progress bars, circular progress rings, counters/KPI numbers, star ratings, badge counts, or any chart, the spec MUST name the OutSystems block in **BOTH** places — the `content[].element`/`content[].data` description AND `outsystems_hints.block`. Never describe these as raw CSS or SVG in either location. The agent reads `content` first and builds what it sees literally — if `content` says "Container with height 8px" but `outsystems_hints` says "ProgressBar", the agent often follows `content` and creates a div.

     **The `content` element must name the block. The `outsystems_hints` must be consistent.**

     | Design element | WRONG `content` (agent builds raw HTML) | CORRECT `content` (agent uses OS block) |
     |---|---|---|
     | Horizontal progress bar | `"data": "Horizontal bar, 8px height, 4px radius. Track is #F8F9FA. Fill color varies..."` | `"data": "ProgressBar block with Progress bound to the occupancy percentage. ProgressColor is #E10613 when > 85%, #16A34A when 60-85%, #2563EB when < 60%. TrailColor=#F8F9FA, Thickness=8."` |
     | Circular progress ring | `"data": "Circular progress ring, 120x120px SVG. Track ring: stroke #E5E7EB, width 10..."` | `"data": "ProgressCircle block with Progress bound to the digitalization percentage. ProgressColor=#E10613, TrailColor=#E5E7EB, Size=120, Thickness=10."` |
     | KPI number with label | `"typography": "24px, 700" + separate label element` | `"data": "Counter block with the count value and label inside Counter.Content placeholder."` |
     | Star rating display | `"data": "5 star icons with color toggle"` | `"data": "Rating block with RatingValue bound to the score, RatingScale=5, IsEdit=False."` |
     | Numeric badge | `"data": "Container with border-radius 50%, number inside"` | `"data": "Badge block with Number bound to the count, Color=Entities.Color.Primary, Shape=Rounded."` |
     | Sparkline/area chart | `"data": "InlineSVG with gradient path, height 80px"` | `"data": "OutSystemsCharts.AreaChart with data from loan counts over last 10 periods. Single series, color #E10613, fill gradient, no axis labels, height 80px."` |

     For each, add an acceptance_checklist item: "[Element] is implemented using [Block] block, not raw containers/SVGs."

**Functional behavior (CRITICAL):**
For every interactive element, describe the **complete behavior** — not just "what it does" but "what happens to the data and UI". The ModelAPI agent handles the implementation (local variables, aggregates, bindings), but it needs clear behavior descriptions to get it right.

WRONG (too vague — agent creates UI but skips wiring):
```json
"action": "Scroll to previous set of currency account cards"
```

CORRECT (describes full behavior — agent knows what to wire):
```json
"action": "Show the previous page of currency accounts. The gallery displays 4 cards at a time. Clicking left shows the previous 4 accounts. The left arrow is disabled when showing the first page. The right arrow is disabled when there are no more accounts to show."
```

Apply this to all interactive elements: tabs that filter data, pagination that pages through records, links that navigate with parameters, forms that save data, toggles that show/hide content.

**Alignment patterns (CRITICAL — agent often misses these):**
When describing layout, be explicit about which element takes remaining space and which is pinned to an edge. The agent creates the containers but often doesn't apply the CSS class that separates them.

For "left content + right content" rows (tabs+arrows, heading+link, name+amount):
- In `outsystems_hints`, state: "The outer container has CSS class `display-flex justify-content-between align-items-center width-100`. The left group and right group are separate child containers."
- For transaction rows where amounts must be far right: "The text column is `flex-1` (fills remaining space). The amount column is `flex-shrink-0` aligned to the right edge."
- For headings with links (e.g., "Transactions" left, "See all" right): same `justify-content-between` pattern.

The agent must apply `justify-content-between` on the PARENT container, not on the children.

**CRITICAL — Use EXACT values from Figma extraction, not assumptions:**

> **Figma extracts Tailwind → Spec uses OutSystems.** Figma MCP returns React+Tailwind code. Read the hex values, px sizes, and layout directions from Tailwind classes during extraction. But when writing the spec, map them to OutSystems UI CSS variables and classes (see `ui-frameworks/outsystems-ui/styles-and-utilities.md`). Never write Tailwind class names in the spec's `outsystems_hints.css_classes`.

**Colors & Sizes (never generalize):**
- Every hex color in the spec MUST come from the extracted design code (e.g., `bg-[#edf0ed]` in Figma → `#EDF0ED` in the spec, not generalized to `#FFFFFF`)
- Map extracted colors to the nearest OutSystems CSS variable where possible (e.g., extracted `#f8f9fa` → `--color-neutral-1`)
- Every pixel size MUST match the extracted code (e.g., `56px` stays `56px`, not rounded to `48px`)
- Every font weight MUST match (e.g., `font-bold` → 700, `font-semibold` → 600)
- Active/inactive state colors MUST come from the extracted code, not assumed from the primary color
- Shadows MUST be copied verbatim from extraction. Map to OutSystems shadow tokens where they match (e.g., `--shadow-s`, `--shadow-m`)
- Do NOT generalize component-specific colors to the design_system level. If cards use `#EDF0ED` but the page uses `#FFFFFF`, those are DIFFERENT tokens.

**Layout & Positioning:**
Every section MUST include a `layout` object with `direction`, `gap`, `padding`, `justify`, `align` extracted from the design. Use OutSystems CSS classes from `ui-frameworks/outsystems-ui/styles-and-utilities.md` — not Tailwind names. For "left + right" rows, use `display-flex justify-content-space-between align-items-center` on the PARENT container. For repeated items (cards, tiles), capture exact dimensions (width, height, min-height, icon sizes).

**Conditional Rendering:** Write as a **single narrative string**, not a structured object. Include: which entity field drives the change, what visual property changes per state (bg color, icon, text color), and how to implement (CSS class switching via If() + Expression widget for dynamic icons).

3. **Verify inline before saving** — before writing the spec file, do a quick self-check against the screenshot:
   - Scan the screenshot top-to-bottom, left-to-right. Every visible region must have a matching `app_chrome` entry or `main_content` section.
   - Every button, link, tab, arrow, and clickable card must have an `action` property.
   - Side-by-side elements must use `type: "group"` with a Columns block, not be separate standalone sections.
   - Colors, sizes, and border-radius values must match extracted values — not generalized (e.g., card bg #EDF0ED not #FFFFFF, active tab #1A1A1A not primary green).
   - Every `main_content` entry has `margin_bottom`.
   - **Source-name → block check (mandatory)**: walk every named frame in the extracted metadata. For each frame whose name contains `Carousel` / `Carrousel` / `Slider` / `Gallery` / `Tabs` / `Wizard` / `Accordion` / `Sidebar` / `Stepper`, confirm the corresponding spec section uses the matching OS UI block (NOT a generic Columns / Container substitute). If even one named region routes to the wrong block, fix it before saving the spec. This catches the "Cards Carrousel → Columns3" regression.
   - **Chrome coverage check (mandatory)**: if `app_chrome.header.content[]` lists more than the default brand wordmark + avatar (e.g., search icon, theme toggle, notification bell-with-badge, welcome text, top-nav links), the spec MUST explicitly call out — both inline AND as separate acceptance_checklist items — that these widgets land inside `Common/UserInfo` (right cluster) and `Common/ApplicationTitle` (wordmark), and that the top-nav links live inside the layout placeholder's `Menu` block. Do NOT leave chrome edits implied — agent reliably skips them when not gated by a dedicated checklist item.

Save extraction notes to `$LOG_DIR/stage1-extraction.md`.

```bash
echo "[$(date +%H:%M:%S)] Stage 1: Spec composed and verified" >> "$LOG_DIR/timing.log"
```

## Stage 2: Invoke Agent

**Split the spec into logical batches for the agent.** The ModelAPI agent works best when given focused work — not everything at once, and not one screen at a time. Group related artifacts together:

- **Entities + roles + ERD** → one spec, one agent call
- **App-chrome blocks** (`Common/ApplicationTitle` wordmark styling + `Common/UserInfo` right-cluster: search/theme/notification IconBadge/welcome text/avatar + top-nav `Menu` block in the layout) → its OWN spec / its OWN agent call. **Mandatory when `app_chrome.header.content[]` lists more than the layout's default brand+avatar.** Buried inside a bulk spec, these edits get skipped consistently — the agent doesn't visit Common-flow blocks during screen construction and treats them as "covered by the layout default." A focused chrome batch with a 4-6 item checklist (one per chrome widget) is the only reliable way to land them.
- **All screens + theme CSS** → one spec, one agent call (referencing the entities and chrome blocks already created)

If a Base OML with entities is already provided, skip the entities step — go straight to chrome, then screens. If the design has no custom chrome beyond brand+avatar (rare), the chrome step can be folded into the screens batch.

For each batch, write a separate spec file (e.g., `step1-entities.json`, `step2-chrome.json`, `step3-screens.json`), minify it, and invoke the agent. The output OML from one batch becomes the input for the next.

**Chrome-batch prompt preamble** (use verbatim when invoking the chrome batch):

```
Phase 0 — Edit the SHARED chrome blocks BEFORE any screen work:
  1) Open Common/ApplicationTitle and style the existing app-name Expression
     per app_chrome.header (apply the wordmark class via ExtendedClass; do NOT
     hand-roll a new wordmark widget anywhere).
  2) Open Common/UserInfo and ADD to its widget tree, in left-to-right order:
     the chrome icon cluster (search / theme toggle / notification IconBadge
     with the count) FOLLOWED BY a welcome-text Expression and the existing
     UserAvatar. Wrap the cluster in a Container with display-flex
     align-items-center column-gap-s.
  3) In the screen's Layout placeholder (LayoutTopMenu.Header or
     LayoutSideMenu.Navigation), add the Menu block from Common and place the
     ILink widgets DIRECTLY inside Menu.PageLinks (no wrapper Container, no
     Style on PageLinks).
After both blocks AND the Menu are populated, read each block's widget tree
back and confirm the expected children landed before declaring this phase
done. Spec follows:
```

```bash
echo "[$(date +%H:%M:%S)] Stage 2: Agent — started" >> "$LOG_DIR/timing.log"

mkdir -p output/<app-name>
cp "${BASE_OML:-oml/initial.oml}" output/<app-name>/work.oml

# For each spec batch file:
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(json.dumps(d,separators=(',',':')))" output/<app-name>/<batch-spec>.json > /tmp/spec-minified.json

# Build the prompt with a preamble that forces complete implementation
SPEC_PREAMBLE="Implement the following spec COMPLETELY. Do NOT stop until every item in the acceptance_checklist at the end of the spec is satisfied. After all code executions, verify each acceptance_checklist item by reading the app state — if any item fails, fix it before finishing. Here is the spec: "

rd-ai-dotnet-cli agent converse "${SPEC_PREAMBLE}$(cat /tmp/spec-minified.json)" \
  --oml output/<app-name>/work.oml \
  --mode model-api \
  --url ws://localhost:8000/ws \
  2>&1 | tee "$LOG_DIR/<batch-name>.log"

# After all batches:
mv output/<app-name>/work.oml output/<app-name>/result.oml
rm -f /tmp/spec-minified.json
echo "[$(date +%H:%M:%S)] Stage 2: Agent — done" >> "$LOG_DIR/timing.log"
```

## Stage 3: Summary

```bash
echo "[$(date +%H:%M:%S)] Pipeline complete" >> "$LOG_DIR/timing.log"
```

Print: Run ID, entity/screen counts, spec size, OML delta, logs path.

## Follow-up

```bash
rd-ai-dotnet-cli agent converse "<refinement>" \
  --oml output/<app-name>/result.oml \
  --mode model-api \
  --url ws://localhost:8000/ws \
  2>&1 | tee "$LOG_DIR/agent-followup.log"
```
