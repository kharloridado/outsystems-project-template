# Skills Index

## Entry point

- `SKILL.md` — top-level router. Load this first; it tells you which deeper skill applies to the task.
- `agent-cli.md` — `rd-ai-dotnet-cli` commands, modes, usage patterns.

## UI Frameworks

### OutSystems UI (Reactive Web + Phone App Template)

Routers + foundations:

- `ui-frameworks/outsystems-ui/SKILL.md` — OS UI task router (load after the top-level `SKILL.md`).
- `ui-frameworks/outsystems-ui/README.md` — framework orientation (themes, layouts, what's in the toolbox).
- `ui-frameworks/outsystems-ui/layouts.md` — LayoutSideMenu / LayoutTopMenu / LayoutBlank and their placeholders.
- `ui-frameworks/outsystems-ui/structural-skeleton.md` — sketch Columns + Cards skeleton BEFORE filling placeholders (mandatory step).
- `ui-frameworks/outsystems-ui/blocks-index.md` — full block catalog with SourceBlock, arguments, placeholders.
- `ui-frameworks/outsystems-ui/widget-conventions.md` — widget JSON rules (content vs Widgets, FULL PATH parameter naming, expression paths, style quoting).
- `ui-frameworks/outsystems-ui/styles-and-utilities.md` — CSS utility classes, theme variables, theming the app.
- `ui-frameworks/outsystems-ui/polish-checklist.md` — mandatory final pass after structural build.
- `ui-frameworks/outsystems-ui/extensibility.md` — JS API, custom events, wrapper blocks.
- `ui-frameworks/outsystems-ui/pattern-client-actions.md` — catalog of OutSystemsUI public Client Actions (SidebarOpen/Close, Carousel Next/Previous/GoTo, DatePicker UpdateDate/Open/Close, Tabs SetActiveTab, Notification, ProgressBar/Circle, scroll/focus/a11y, device/network detection).

Pattern catalogs (load only the category that matches the task):

- `ui-frameworks/outsystems-ui/patterns/content.md` — Card, Alert, Tag, Accordion, Section, Tooltip, UserAvatar, BlankSlate.
- `ui-frameworks/outsystems-ui/patterns/interaction.md` — Carousel, Sidebar, DatePicker, Dropdown, BottomSheet, Sliders.
- `ui-frameworks/outsystems-ui/patterns/navigation.md` — Tabs, Wizard, Breadcrumbs, Pagination, Timeline, BottomBar.
- `ui-frameworks/outsystems-ui/patterns/numbers.md` — Counter, ProgressBar, ProgressCircle, Badge, IconBadge, Rating.
- `ui-frameworks/outsystems-ui/patterns/adaptive.md` — Columns2–6, ColumnsMedium/Small, Gallery, MasterDetail, DisplayOnDevice.
- `ui-frameworks/outsystems-ui/patterns/utilities.md` — AlignCenter, Separator, InlineSVG, MouseEvents, SwipeEvents.

Recipes (screen-level + block-level — load BEFORE writing widget JSON when the request matches):

- `ui-frameworks/outsystems-ui/recipes/README.md` — recipes index.
- Screen-level: `paginated-list-with-filters.md`, `create-edit-form-screen.md`, `popup-modal-dialogs.md`, `columns-and-cards-dashboard.md`, `gallery-with-filters.md`.
- Block-level: `horizontal-card-carousel.md`, `tab-switcher.md`, `sidebar-navigation.md`, `info-banner.md`, `buttons-and-clickables.md`, `button-with-icon.md`, `avatar-and-icon-badge.md`, `transaction-list.md`, `kpi-counters.md`, `kpi-card-with-trend.md`, `progress-card.md`, `sparkline-card.md`, `chart-card.md`.

## UI Components (standalone)

- `ui-components/outsystems-charts/README.md` — OutSystems Charts (Donut, Bar, Line, Area, Pie, Column) — load when the design has a chart.

## References (screen archetypes + cross-cutting)

Screen archetypes:

- `references/dashboard.md`, `references/list-table.md`, `references/detail-view.md`, `references/edit-form.md`, `references/master-detail.md`, `references/gallery-grid.md`, `references/kanban.md`, `references/timeline.md`, `references/calendar.md`, `references/wizard.md`, `references/map-view.md`, `references/inbox-notifications.md`, `references/settings.md`.

Cross-cutting:

- `references/design-system.md` — theme tokens, brand recoloring, palette swap.
- `references/component-selection.md` — picking the right block per requirement.
- `references/states-and-feedback.md` — empty/loading/error states, toasts, validation.
- `references/reusable-blocks.md` — when to extract a Web Block vs inline.
- `references/app-type-styling.md` — Reactive Web vs Phone App stylistic differences.

## Quality review

- `review-ui-implementation/SKILL.md` — score an OutSystems UI implementation against the 16-criterion UI Implementation Quality Assessment rubric. Read-only; produces evidence-backed scores, a weighted total, and a tier. Inspection recipes (grep / jq / diff) per criterion. Use for single-app review or batch calibration against multiple `output/<app>/` runs.
- `runtime-ui-audit/SKILL.md` — audit a **live runtime URL** (not an OML) against the 16-criterion **UI Quality Assessment** rubric. Read-only; captures desktop + mobile screenshots, a shallow in-app crawl, interaction states (focus ring, hover), and a mechanical probe (tap-target sizes, motion/transition/focus signals) via Playwright + system Chrome, then scores each criterion Market Leading→Broken with evidence and a weighted total + tier. Complements `review-ui-implementation` (build quality) by judging what the user sees and experiences.

## Load order rules

1. Load `SKILL.md` first.
2. Load `ui-frameworks/outsystems-ui/SKILL.md` (the OS UI router) when doing any UI work.
3. Load ONE leaf doc per question. If you find yourself loading 3+ leaf docs, re-read the router and pick the smallest set.
4. References / patterns / recipes are loaded ON DEMAND, never pre-fetched.
