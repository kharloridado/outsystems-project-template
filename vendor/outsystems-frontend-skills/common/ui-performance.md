---
name: outsystems-ui-performance
description: UI performance for OutSystems apps — pagination, lazy loading behind tabs/accordions, image sizing, search debouncing, aggregate filtering, OnReady cost. Use when reviewing slow screens, optimizing list/dashboard performance, or fixing aggregate over-fetching.
---

# UI Performance in OutSystems Apps

> **Goal:** keep screens fast — first paint, interaction latency, and large-list rendering. Most performance wins come from data and rendering decisions, not micro-optimizations.

## Top wins (do these first)

1. **Paginate every list.** Never fetch all rows when you'll show 8–50 at a time.
2. **Use `Fetch: AtStart` only when the data is needed for the initial render.** Defer expensive data with `Fetch: Only on Demand` and a refresh trigger.
3. **Filter and join in the aggregate, not in the screen.** `IfWidget` over a 5000-row aggregate is slower than re-querying with a filter.
4. **Lazy-load behind tabs and accordions.** Heavy content gated by an `IfWidget(<TabIsActive>)` doesn't render until needed.
5. **Use `ConvertList` once per render, not per row.** When passing aggregate data to `DropdownSearch.OptionsList`, build the converted list at the screen level, not inside a list iterator.
6. **Compress images and use the right dimensions.** Don't ship 4000×3000 hero images to a 320px-wide phone slot.

## Aggregates and data fetching

### Pagination is mandatory for lists

Every list bound to an aggregate that could grow MUST be paginated. The `Pagination` block expects:

- `MaxRecords` LocalVariable (Integer, e.g. 8 or 12) — bound to the aggregate's `MaxRecords`.
- `StartIndex` LocalVariable (Integer, default 0) — bound to the aggregate's `StartIndex`.
- `TotalCount` argument bound to `<Aggregate>.Count`.

Without pagination, even a "small" entity grows to thousands of rows after a year and the screen becomes unresponsive.

### Aggregate filters beat client-side IfWidget

Don't fetch all rows then filter with `IfWidget(<row matches>)`. Push the filter into the aggregate:

```
GetUsers.Filters: SearchKeyword = "" or Sample_User.Name like "%" + SearchKeyword + "%"
```

Updates trigger via `RefreshDataNode` after assigning new filter values.

### Use joins to avoid N+1 queries

Joining related entities once in the aggregate is far cheaper than fetching parent rows then querying children per item:

```
GetRequests with LeftJoin Sample_Priority on Sample_Request.Priority = Sample_Priority.Id
```

Bind expressions to `GetRequests.List.Current.Sample_Priority.Label` directly — no additional fetch.

### Tune `MaxRecords`

`MaxRecords` on the aggregate is a hard cap. Tune to the page size + a small margin (e.g., 50 for a list with `Pagination.MaxRecords = 25`). Don't set it absurdly high "just in case" — every row costs network and memory.

### `Fetch` modes

| Mode | When |
|---|---|
| `AtStart` | Data needed for first paint. |
| `Only on Demand` | Data only needed after a user action — fetch via `RefreshDataNode` when needed. |

Avoid `AtStart` for aggregates that load 1000+ rows or run expensive joins, when the user might not even scroll to that section.

## Rendering and lazy loading

### Tabs

Heavy content inside non-default tabs is wasted work on first paint. Gate inner content with `IfWidget` keyed off a `CurrentTab` LocalVariable:

```jsonc
"TabsContentItem.Content" → "IfWidget Condition: CurrentTab = 1"
```

Update `CurrentTab` from the `Tabs.OnTabsChange` event.

### Accordions

Same trick — track per-item expanded state in a LocalVariable and gate heavy content (lists, charts) inside `IfWidget`. Use the `OnToggle` event to flip the variable on first expansion only (track which items have been opened).

### IfWidget vs Container Visible

- `IfWidget` doesn't render the false branch at all — best for heavy content.
- `Container.Visible` renders but hides via CSS — cheaper for small show/hide toggles where the DOM cost is negligible.

For anything heavy (charts, long lists, embedded videos), use `IfWidget`.

### Avoid over-nested layouts

Each `UIBlockInstanceWidget` adds DOM and a tiny bit of JS lifecycle overhead. Don't wrap a `Container` in a `Container` in a `Card` in a `Section` for cosmetic spacing — use spacing utilities or `MarginContainer`.

## Image performance

### Use the right size

OutSystems serves the binary as-is. Resize images server-side or upload pre-sized variants. A 4000px image rendered in a 200px slot wastes bandwidth.

### Static vs binary images

| Type | When |
|---|---|
| **Static** (in module's resources) | Logos, illustrations that ship with the app. Cached aggressively, served from CDN. |
| **Binary** (in entity attribute) | User-uploaded content, content that varies per record. |

For dynamic images that don't change often, store them as Files (resources) instead of Binary attributes — better caching.

### Lazy-load offscreen images

Use `loading="lazy"` on `ImageWidget` via `ExtendedProperties`:

```jsonc
{ "Object": "ImageWidget", "Image": "…",
  "ExtendedProperties": [{ "Property": "loading", "Value": "\"lazy\"" }] }
```

The browser defers loading until the image scrolls into view. Don't apply to above-the-fold hero images — that delays LCP.

### Inline SVG for small icons

Tiny icons as separate image files cost a request each. Use `Icon` (font glyph) or `InlineSVG` for small decorative graphics.

## Client-side cost

### Avoid heavy `OnReady` actions

`OnReady` runs on every navigation to the screen. Keep it small: read a query string, set initial state. Don't make API calls there — use `Fetch: AtStart` aggregates instead, which run in parallel with rendering.

### Debounce search inputs

A search input with `OnChange → RefreshDataNode` fires on every keystroke. For typing speed, debounce in the ScreenAction:

- Track the latest keystroke in a LocalVariable.
- Use `WaitNode` with a small delay (200–300ms).
- Only refresh if the variable hasn't changed since the wait started.

OutSystems UI doesn't ship a built-in debounce — implement at the ScreenAction level.

### Limit `OnAfterFetch` work

`OnAfterFetch` runs after every aggregate refresh. Heavy logic there blocks the render. Keep it to small assignments (e.g., setting a default selected row).

## Network and bundling

### One Block per concern

Block stylesheets and scripts are loaded only when the Block is used on a screen. Splitting your app into focused Blocks gives you natural code-splitting.

### Don't import third-party CSS frameworks

Bootstrap, Foundation, Tailwind — they double the bundle size and conflict on common selectors. OutSystems UI already provides spacing/typography/layout primitives. Override tokens to rebrand.

### Avoid blocking JavaScript on `OnReady`

If a Block needs an external JS library, use `RequiredScripts` so OutSystems loads it once and caches it. Don't `<script src="…">` inline in HTML widgets.

## Measurement

Before optimizing, measure:

- **Browser DevTools Performance tab** — record a screen load, look for long tasks (>50ms) and large layout shifts.
- **Lighthouse** — runs the Core Web Vitals suite (LCP, FID, CLS) and gives concrete improvement suggestions.
- **OutSystems LifeTime monitoring** — server-side timing for aggregates and screen actions. Slow aggregates show up here before users complain.

## Quick checklist

- [ ] Lists are paginated.
- [ ] Aggregates filter/sort/join in SQL, not in the screen.
- [ ] Heavy content (charts, long lists) gated behind `IfWidget` for non-default tabs/accordions.
- [ ] Images are correctly sized; offscreen images use `loading="lazy"`.
- [ ] Search inputs debounce before refreshing.
- [ ] No unnecessary `OnReady` work on every navigation.
- [ ] Block-scoped CSS instead of global theme rules.
- [ ] No hardcoded color/spacing — use tokens (so theme changes don't require code changes).
- [ ] No third-party CSS frameworks layered on top of OutSystems UI.

## Source

OutSystems publishes [Best practices for enhancing UI performance](https://success.outsystems.com/documentation/11/building_apps/user_interface/best_practices_for_enhancing_ui_performance/) which covers similar ground in more depth.
