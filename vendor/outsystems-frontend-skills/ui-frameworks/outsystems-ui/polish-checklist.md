---
name: osui-polish-checklist
description: Mandatory polishing pass after the structural build is done — typography hierarchy, brand-color emphasis, breathing room, realistic content, default-child cleanup. Use this when the structural build is complete to turn a wireframe-looking screen into a finished one.
---

# OutSystems UI — Polishing Checklist

> **What this is:** the difference between "structurally correct OS UI blocks" and "actually looks like a finished app." OS UI's default styling is functional but **vanilla** — without an explicit polishing pass the result looks like a wireframe even when every widget is the right type.

> **When to use:** After the structural build (layouts, blocks, content placeholders) is complete and validation is clean. Before declaring a screen done.

This is a **non-optional final pass.** Skipping it is why agents ship "fake-looking" UI even when they used the right blocks.

## The 7-step polishing pass

Run through every step. Each one takes one or two `execute_code` calls.

### 1. Default children deleted

Most OS UI container blocks ship with **default children** — pre-populated child instances that are visible in the design-time editor. They remain when you populate programmatically, rendering as "Use this placeholder to…" placeholder text in the final UI.

| Block | Children to delete |
|---|---|
| `Tabs` | 3 default `TabsHeaderItem` + 3 default `TabsContentItem` (in Header and Content placeholders) |
| `Carousel` | 1 default `IList` widget (in `CarouselItems`) |
| `Wizard` | Default `WizardStep` items |
| `Accordion` | Default `AccordionItem` items |
| Anything block-with-children | Always check first by reading `placeholder.Widgets.Count()` after instantiation |

See [`blocks-index.md`](blocks-index.md#specific-block-instance-gotchas-from-real-builds) for the deletion pattern.

### 2. Typography hierarchy

A polished screen has a clear typographic hierarchy. The agent's default — putting everything in `Text` widgets with the same visual weight — flattens the design.

| Use | Where |
|---|---|
| `AdvancedHtml Tag="h1"` | Screen title (in `Layout.Title` placeholder, never elsewhere) |
| `AdvancedHtml Tag="h2"` | Section heading (Account, Transactions, Manage Card) |
| `AdvancedHtml Tag="h3"` | Card title or subsection heading (currency name on a card, transaction recipient name) |
| `AdvancedHtml Tag="strong"` | Inline emphasis on a value (the balance amount on a currency card) |
| `AdvancedHtml Tag="p"` | Body copy / multi-line text |
| `Text` widget | Plain dynamic text expressions |

**Don't** use a single `Text` for "12,500.00 GBP British Pound" — split into `<strong>£12,500.00</strong>` (amount) + `<span>British Pound</span>` (label) so the amount visually dominates.

### 3. Brand color used sparingly

OS UI's `Entities.Color.Primary` is the brand color. **It should appear 2–3 times max per screen** — applied to the most important affordances. More than that and the color stops being emphasis.

Good places for brand color:
- The primary CTA button (`Send money`, `Save`, `Submit`).
- The active tab indicator (set automatically by `Tabs`, just don't override it).
- A KPI counter highlighting the most important stat.
- An `Alert` block flagging an important notice.

**Don't** color-saturate the screen. Most surfaces should be `Color.Neutral0`–`Neutral2`.

### 4. Breathing room (spacing utilities)

Use OS UI's spacing utility classes, not custom margin CSS:

| Need | Class |
|---|---|
| Generous space between sections (Account → Transactions → Banner) | `margin-top-xl` (or `margin-top-l` for tighter) |
| Space between sub-elements within a section | `margin-top-base` |
| Tight pairing (label + value) | `margin-top-xs` |
| Pad inner content of a section | `padding-base` / `padding-l` |

Apply via the `Style` property: `Style: "\"margin-top-xl\""` (note: it's an expression, escape the inner quotes).

A polished screen has obvious "between" spacing. A wireframe has elements pressed up against each other.

### 5. Realistic placeholder content

When the request mentions a list / cards / banner without specifying content, **don't leave it empty or with a single item** — populate with realistic sample content:

| Scenario | Bad | Good |
|---|---|---|
| Currency cards | 1 generic card | 3–4 cards with real currencies (GBP, USD, EUR, SGD) and plausible balances |
| Transaction list | 0 rows or "Sample transaction" | 4–5 rows with varied recipients, dates, amounts (some + some −) |
| User name on greeting | "User" | "Welcome back, Sarah" or similar |
| Card detail "card number" | empty / `0000 0000` | masked PAN like `•••• •••• •••• 1234` |

The user wants to see what the finished screen will *look like*. Empty placeholders make it look broken even when the structure is right.

### 6. Active state / visual hierarchy

Within a screen, **one element should clearly be the focus.** Use size, color, and spacing to make it obvious.

- On a dashboard with multiple cards: the most important card is bigger or has a brand-color accent.
- On a sidebar with multiple nav items: the active item is highlighted (the `Menu` block does this automatically — just make sure the active screen's nav link is recognized).
- On a card detail: the card visual is large and centered, the action buttons cluster around it.

Avoid screens where every card / row / button has the same visual weight — they read as a wireframe, not a designed UI.

### 7. Section headings as `AdvancedHtml h2`

Every logical section gets a heading. **Use `AdvancedHtml Tag="h2"` for section titles, not plain `Text` or styled `Container`.** This:
- Maps to a real `<h2>` in the rendered HTML (accessibility wins).
- Inherits the theme's heading typography (visual hierarchy wins).
- Makes the section navigable by screen readers.

```
MainContent
  ├── AdvancedHtml Tag="h2" → "Account"           ← section heading
  ├── Container (Tabs + Carousel here)
  ├── AdvancedHtml Tag="h2" → "Transactions"      ← section heading
  ├── Container (transaction list here)
  └── ...
```

If your screen has 3 main sections and only 0 or 1 `h2`, that's a polish failure.

## Self-review questions before declaring done

Before saying the screen is complete, ask yourself (and verify):

1. Did I delete every block's default children?
2. Is there an `h1` exactly once (in the Layout's Title placeholder)?
3. Does each major section have an `h2`?
4. Is the brand color used 2–3 times max, on the most important affordances?
5. Are there visible margins / padding between sections (margin-top-xl or similar)?
6. Did I populate the screen with realistic placeholder content (not "Sample" / "Test" / "Lorem")?
7. Is one element clearly the visual focal point?
8. **Multi-element rows: am I using a `Columns*` block (not flex containers / `Container` + CSS)?** If a row has 2+ siblings displayed horizontally, it should be `Columns2`–`Columns6` or `ColumnsMediumLeft`/`Right` / `ColumnsSmallLeft`/`Right`. **Every `Columns*` has `PhoneBehavior = Entities.BreakColumns.All`** — not `None`, not unset. No exceptions, even for 2-column rows. A 2-col row stays side-by-side on phone (< 480px) without this and the layout breaks.

8a. **Stacked `Columns*` siblings have row-gap margin?** When two or more `Columns*` instances live in the same placeholder vertically (e.g. KPI `Columns4` then content `Columns2`), the **second and later rows need `ExtendedClass = "margin-top-l"`** (or `margin-top-base` for tight pairings, `margin-top-xl` for major section breaks). Without it the rows run together — the screen looks like one big grid instead of distinct sections. Same rule applies to a `Columns*` followed by `IList` / `Card` / anything at the same level. See [`structural-skeleton.md#row-spacing--stacked-columns-siblings-need-explicit-margin`](structural-skeleton.md#row-spacing--stacked-columns-siblings-need-explicit-margin).

8b. **No leftover default `"Button"` text on `IButton` / `ILink` widgets?** Tripwire: search the OML for the literal `"Button "` followed by another word, or `"Link "` ditto. If `Button + Add Money`, `Button Send`, or similar shows up rendered, you added a NEW `ITextWidget` to a button WITHOUT mutating or deleting the default one. Fix: either mutate the existing `ITextWidget` (`button.Widgets.First()`) or `foreach (var w in button.Widgets.ToList()) w.Delete();` then rebuild. See [`recipes/button-with-icon.md#default-children-decision-table`](recipes/button-with-icon.md).

8c. **`Card` siblings in a `Columns*` row have `ExtendedClass="full-height"`?** When 2+ `Card` / `CardSectioned` / `CardBackground` blocks share a `Columns*` row (KPI tiles, currency tiles, metric cards), every one of them needs `ExtendedClass = "full-height"` so they match the tallest. Without it, a shorter card visibly drops below its neighbors and the row looks broken. Single-cell rows don't need this. See [`structural-skeleton.md#equal-height-cards-across-a-row--full-height`](structural-skeleton.md#equal-height-cards-across-a-row--full-height).

8d. **No hand-rolled `RowN` / `ItemN` Container siblings instead of an `IList`?** Tripwire: list every Container widget under any Card's `Content` placeholder. If you see N siblings named `TxRow0`, `TxRow1`, …, or `Item0`, `Item1`, …, or any pattern of numbered repeating containers, **that's the hand-rolled-row anti-pattern** — those should be a single `IList` widget over an aggregate (or a mocked `LocalVariable` populated via `ListLiteral` of `RecordLiteral`s in `OnInitialize`), with one `IListItem` + `ListItemContent` block as the row template. Five `<div>` siblings = wrong. One `IList` with 5 rendered rows = right. See [`recipes/transaction-list.md`](recipes/transaction-list.md) and [`recipes/transaction-list.md#when-you-dont-have-an-entity-to-bind-to--mock-with-literal-records`](recipes/transaction-list.md#when-you-dont-have-an-entity-to-bind-to--mock-with-literal-records).

8e. **No `animate-*` utility CSS classes faking the `Animate` block?** Tripwire: grep the changed.oml for `class` / `Style` strings containing `animate-fade-in`, `animate-fade-out`, `animate-slide-`, `animate-rotate-`, etc. **If they appear, the agent used a CSS utility class instead of the real `Animate` block from `OutSystemsUI/Interaction`.** The `Animate` block is what gives you the staggered-row cascade via `Delay = .CurrentRowNumber * 50`, FadeIn/SlideIn variants tied to `AnimationType` enum, theme-correct timing curves, and a-11y respect for `prefers-reduced-motion`. CSS utility classes give you none of that. Fix: replace the styled Container with `interaction.Nodes.OfType<IMobileBlockSignature>().Named("Animate")` instantiated as an `IMobileBlockInstanceWidget`. See [`recipes/transaction-list.md`](recipes/transaction-list.md) step 4 for the canonical pattern.

8f1. **Sibling consistency: are all "card" surfaces in the same column / row using the SAME block path?** If you used a `Card` block for one item in a section (e.g. the "New Computer" goal card), every other sibling card in that section MUST also be a `Card` block — not a styled `Container`. Mixing the two paths is a common failure: one item gets the Card's free shadow / radius / padding / theme behavior, the next item is a `Container` styled to LOOK similar but drifts on theme changes and loses the block-level scaffolding. **The decision is per-section, not per-item.** If one card-shaped region in a vertical stack is a `Card` block, all of them are. Tripwire: walk every `Columns*` cell and every sidebar section — list its direct children. If you find a mix of `Card` / `CardSectioned` / `CardBackground` instances AND styled `Container` widgets at the same level, replace the Containers with the matching Card variant.

8f. **No placeholders left as "Click to add ..." stubs in the rendered output?** Every placeholder in every block instance needs to either be filled with widgets or be intentionally left empty (which is fine for optional placeholders like `Card.Footer` when there's no footer content). The renderer surfaces unfilled placeholders as `"Click to add Content"` / `"Click to add Title"` etc. — those are visible in the runtime UI and read as "this screen is half-built." Tripwire: after every block instantiation, list `block.PlaceholdersContent` and check that placeholders meant to hold content actually have widgets in them. If a card was supposed to host a `ProgressBar` and the `Content` placeholder is empty, that's a structural failure not a styling one.
9. **Visual content groupings: am I using a `Card` family block (not styled `Container`s)?** Every rectangular grouping of related content (KPI tile, settings panel, summary box, list row, profile card) is `Card`, `CardItem`, `CardBackground`, or `CardSectioned` — picked by content shape, not by visual style.
10. **Custom CSS sanity check: was an OS UI utility class or block argument available first?** Spacing → utility class (`margin-top-xl`). Color → `Entities.Color.*` or theme variable. Padding/gutter → block arg (`Card.UsePadding`, `Columns3.GutterSize`). Custom `StyleSheet` rules are only justified when no utility, no block arg, and no theme variable expresses the need.
11. **Exactly one Layout block at the screen root?** Run this count and verify it equals 1:

    ```csharp
    var layoutCount = screen.GetAllDescendantsOfType<IMobileBlockInstanceWidget>()
        .Count(w => w.SourceBlock?.Name?.StartsWith("Layout") == true);
    // Must be 1.
    ```

    If it's 2, you almost certainly forgot that `CreateScreen` ships with a default `LayoutTopMenu` widget that must be deleted **before** adding your chosen Layout — see [`layouts.md#before-you-add-any-layout--delete-the-default-one-the-screen-ships-with`](layouts.md#before-you-add-any-layout--delete-the-default-one-the-screen-ships-with). Specifically, if your widget tree shows BOTH `LayoutTopMenu` (with empty Header/Breadcrumbs/Title/Actions placeholders) AND `LayoutSideMenu` (with Navigation filled), delete the `LayoutTopMenu` — that's the leftover default. The screen renders BOTH if you don't.
12. **Every icon is a real `IIcon` widget with a Phosphor name and `IconSize=FontSize`?** No emoji (`🏠`, `💳`, `📧`) in text widgets. No `Container` styled as a colored circle as a fake icon. No FontAwesome legacy names (`fa-home`, `cog`, `envelope`). Phosphor names: `house`, `credit-card`, `gear`, `users`, `currency-dollar`, `arrow-up-right`, etc.
13. **Sidebar `PageLinks` container is unstyled?** The Menu block's `PageLinks` ships with theme-correct padding and item spacing. Setting `Style` / `CustomStyle` / `SetStyle` / `Width` on it (or wrapping the Links in a custom Container inside it) overrides those defaults and produces nav items flush-left with no breathing room. The pattern is `pageLinksContainer.CreateWidget<ILink>(...)` directly — no styling on the container, no wrapper Container. See [`recipes/sidebar-navigation.md`](recipes/sidebar-navigation.md).
14. **If the request specifies a theme (dark mode, brand recolor, custom palette): are the OS UI CSS variables overridden in the THEME's `StyleSheet` (not a screen's, not with custom variable names, not scoped to a wrapper class)?** The widgets read `--color-neutral-0`–`-10`, `--color-primary`, `--color-background-body`, `--color-text-primary`, etc. Overriding *those* on the theme's `:root` re-themes the entire app automatically. Inventing names like `--bg-deep` / `--accent`, scoping with a `.dark-mode { ... }` wrapper class, or putting the CSS on a screen StyleSheet all produce the same failure mode: the visual surface stays at the default light theme even though the CSS exists. See [`styles-and-utilities.md#theming-the-app-dark-mode-full-rebrand-palette-swap`](styles-and-utilities.md#theming-the-app-dark-mode-full-rebrand-palette-swap).

15. **Block-substitution review: are there custom `Container` / CSS shapes that should be real OS UI blocks?** Walk through the screen's StyleSheet and widget tree once more. For every custom CSS class you defined and every styled `Container`, ask: "Is there a real OS UI block that does this?" The most common substitutions:

    | Custom shape you wrote | Replace with |
    |---|---|
    | `<div>` with `border-radius` + `background` + `padding` for a content surface | `Card` block (theme-aware shadow / radius / padding) |
    | `<div>` with `border-radius: 50%` + gradient + initials text inside | `UserAvatar` block (handles photo/initials fallback) |
    | `<span>` absolute-positioned over an icon with a count | `IconBadge` block (`Number`, `Color`, `IsLight` args) |
    | `<div class="progress-track"><div class="progress-fill" style="width: 68%">` | `ProgressBar` block (`Progress`, `Thickness`, `OptionalConfigs`) |
    | `display: grid; grid-template-columns: repeat(N, 1fr)` for a uniform N-column row | `Columns2` / `Columns3` / `Columns4` block (responsive `PhoneBehavior`) |
    | Flex-column of `<div class="row">` divs with hardcoded content | `IList` over a screen aggregate, with `ListItemContent` block per row |
    | Hand-rolled chip / pill div with text inside | `Tag` block (`Color`, `Shape`, `IsLight`, `Size` args) |
    | `<div>` shaped as a hero/section card with a header strip + content + footer | `CardSectioned` block (Title / Content / Footer placeholders) |
    | `conic-gradient(...)` donut, hand-drawn pie, or svg chart | `DonutChart` / `PieChart` / `BarChart` / `AreaChart` from `OutSystemsCharts/Charts` (+ `ChartLegend` addon) |
    | Two stacked card divs with a tab-like switcher above | `Tabs` + `TabsHeaderItem` + `TabsContentItem` blocks |
    | Side-stacked or fan-stacked cards the user swipes through | `StackedCards` block from `OutSystemsUI/Interaction` |

    **Tripwire question**: how many custom CSS classes are defined on this screen? **If more than ~15 for a single screen, you've almost certainly built fake UI** — go back and substitute. Each CSS-only shape that has an OS UI counterpart is a regression: it loses theme awareness, accessibility, responsive behavior, and any future block-level improvement.

16. **Layout block sanity check: did the design pressure push you to `LayoutBlank` + a custom shell?** If your screen StyleSheet contains rules like `min-height: 100vh; display: flex` for the page, `width: 240px; position: sticky` for a sidebar, `flex: 1; overflow-y: auto` for a main area — you've replaced the layout block with custom CSS. Switch to `LayoutSideMenu` (or `LayoutTopMenu`) and let the layout own the shell. The dark theme / custom design still works via theme variable overrides — bespoke visuals don't justify dropping the layout. See [`layouts.md#when-the-design-feels-too-custom-for-a-layout-block-the-dark-mode-trap`](layouts.md#when-the-design-feels-too-custom-for-a-layout-block-the-dark-mode-trap).

17. **Did the build use `revert_changes` at any point?** If yes, **re-verify each phase-0 setup phase still survived**:
    - **Read back the theme stylesheet**: `get_theme(<theme_name>)` — confirm your dark-mode / brand variable overrides are still present at `:root`. If the stylesheet is back to default boilerplate, the revert wiped it; **re-apply the theme.StyleSheet edit immediately**.
    - **Check the Menu block's PageLinks**: open the Menu block and confirm your nav `ILink` widgets are still wired to the correct screens.
    - **Inspect any shared blocks you edited** (e.g. LayoutSideMenu's top-bar additions) for similar wipe.
    - **Inspect the default screen setting** if you set one.

    `revert_changes` rolls back more than the immediately failed step — it can wipe earlier phase-0 work that hasn't been protected by validation. **Never assume the OML is in the state you last saw it after a revert.** Always re-read the artifacts you care about. The v3 fintech run lost its dark theme this way: agent wrote `theme.StyleSheet = "..."`, then a later failed `execute_code` triggered `revert_changes(steps_back=1)`, which wiped the theme too — and the agent never re-applied it, so the screens rendered against the default light theme even though the structural blocks were in place.

18. **Custom-class scan + theme_extensions trace**: enumerate every `widget.SetStyle("\"<class names>\"")` and every `*.ExtendedClass` arg value across both screens. For each token (split on spaces), ask:
    - Is the class an OS UI utility (`background-neutral-1`, `text-primary`, `display-flex`, `column-gap-s`, `margin-top-base`, `font-bold`, `border-radius-soft`, etc.)? ✅ keep.
    - Is the class a project-prefixed name (`hb-vcard`, `hb-stat-card`, `hb-toggle-card`, `my-app-card`, `<anything>-card` / `-row` / `-tile` / `-pill`)? ❌ that's a tell — go back to step #15 (block-substitution review) and replace the `Container` with the real OS UI block. Even if the class is defined, the underlying widget should be a real block, not a styled `Container`.
    - Is the class declared in the spec's `design_system.theme_extensions.classes[].name`? Then the theme StyleSheet MUST contain a matching `.<name> { <rule> }` rule. Read the theme StyleSheet and confirm every `theme_extensions.classes[].name` appears exactly once as a rule.
    - Is the class neither an OS UI utility NOR in `theme_extensions.classes[]`? ❌ undefined reference — the widget renders default-styled and your `SetStyle` is a no-op. Either declare it in `theme_extensions` or remove the reference.

    **Theme-stylesheet emission check** (mandatory): the theme's StyleSheet must contain (a) a single `:root { ... }` block with every entry from `design_system.theme_extensions.css_variables` exactly once and (b) one `.<name> { ... }` rule per `theme_extensions.classes[]` entry. NO duplicate `:root` blocks. NO duplicate class rules. By default, `theme_extensions` is **theme-wide** — every class declared in the spec emits onto the theme StyleSheet.

    **Screen-StyleSheet exception** (rare): per [`styles-and-utilities.md`](styles-and-utilities.md#when-you-need-a-class-based-override), a class rule MAY live on a single screen's StyleSheet instead of the theme's when (a) the visual is genuinely one-off (a hero gradient, a single-screen animation, a one-time chart bar fill) AND (b) the class is referenced by widgets on that screen only. If you take this exception, the screen-scoped rule is NOT declared in `theme_extensions` — declare it in a per-screen field (e.g., on the screen spec itself) and emit onto the screen's StyleSheet. Anything reused across 2+ screens MUST go in `theme_extensions` instead. Tripwire: list every class referenced via `ExtendedClass` across all screens; any class appearing in 2+ screens that lives on a screen StyleSheet is a violation — move it to `theme_extensions`.

    **Variable-trace check**: every class rule body in `theme_extensions.classes[]` should reference colors / shadows / sizes via `var(--...)` — not hardcoded hex/px. If the same hex appears in 2+ rule bodies, it should be a variable. Read each class rule and grep for `#[0-9a-fA-F]{3,8}` and `px` literals; any repeated value means the corresponding variable is missing from `css_variables`.

    **Tripwire**: `grep -oE "\"[a-zA-Z][a-zA-Z0-9-]+\"" <generated-code> | sort -u` — for each unique class string, confirm it's either an OS UI utility OR has a `.<class-name>` rule in the theme StyleSheet AND in the spec's `theme_extensions.classes[]`. Three-way agreement (spec declares → theme emits → widget references) is what makes this pass. Any token failing the three-way check is the v3 fintech failure mode that produced "structurally correct but visually default" output.

19. **Zero out auto `MarginLeft` on `IButton` / `ILink` (and any `Container` that sits next to its siblings without a flex parent).** ODC's runtime injects a non-zero `margin-left` on these widgets by default. The symptom: an icon-button row where the first button sits inset from the container's left edge, a CTA that won't hug the column edge, a header row where items don't visually align with the section below. **Set `MarginLeft = "0"` explicitly** on every `IButton` / `ILink` whose parent is NOT a flex container with `column-gap-*` (because in a flex container the gap utility owns spacing). Tripwire: after build, walk every `Button` and `Link` in the screen tree (`screen.GetAllDescendantsOfType<IButton>()`, same for `ILink`). For each, the rule is:
    - Parent has `Style` containing both `display-flex` AND `column-gap-*`/`row-gap-*` → leave `MarginLeft` alone (the gap utility wins).
    - Otherwise → `widget.MarginLeft = "0"` MUST be set explicitly.
    
    If neither holds and `MarginLeft` is null/empty, the widget renders with the auto margin and the row alignment looks broken even though the structure is correct.

20a. **Brand wordmark / app title goes via `Common/ApplicationTitle`, not a hand-rolled wordmark anywhere else.** Every OS app ships with an `ApplicationTitle` block in the `Common` flow — it already contains an Expression bound to the app name. When the design has a brand wordmark in the top bar or sidebar (the "WISE" / "ACME" / "Brand" text), customize that block: open `Common/ApplicationTitle`, style its existing expression via `ExtendedClass` + a class on the theme StyleSheet (typography, weight, letter-spacing, text-transform, color), leave the binding alone. Tripwire: search the screen tree and the Menu block for any `AdvancedHtml`/`TextWidget`/`Expression` whose literal text is the app's brand name. If you find one outside `Common/ApplicationTitle`, that's a duplicate — delete it and apply the styling to the `ApplicationTitle` block instead. Symptom of getting this wrong: the brand appears twice in the rendered chrome (once from `ApplicationTitle`, once from your hand-rolled copy), and renaming the app updates only one of them.

20b. **Notification bell / mailbox / status indicator / quick-action chrome icons go inside `Common/UserInfo`, not the screen's `Header` placeholder.** The `UserInfo` block in the `Common` flow already lives in the top-bar's right slot (alongside the user avatar) and is the canonical home for chrome icons that cluster with the avatar — bell-with-`IconBadge`, mail icon, theme/language toggle, etc. When the design shows a bell at the top-right of the chrome, **edit `Common/UserInfo` to add an `IconBadge` block** (with `IIcon` Phosphor `bell` inside its `Icon` placeholder), positioned to the left of the existing avatar widget. **Don't put it in the screen's `Header` placeholder** — that placeholder is the MIDDLE slot of the top bar, intended for per-screen content like a search box or breadcrumbs. A bell placed there drifts left of the avatar and reads as a header artifact, not a chrome control. Tripwire: walk the screen tree's `Header` placeholder contents — if you find an `IconBadge` or bell `IIcon` there, move it into `Common/UserInfo`. The `Header` placeholder should be empty (or hold only per-screen middle-slot content) on chrome-heavy screens.

20. **Stacked text widgets need flex-column-with-gap OR each text wrapped in its own Container.** `ITextWidget` and `NRWidgetsExpression` render as `inline-block` by default. Two text widgets placed as direct siblings inside a plain `Container` will sit on the same baseline (with whatever whitespace ODC injects), then wrap inline-flow — they will NOT stack vertically with a consistent gap, even though the design clearly shows them stacked. Common failure spots: card body (amount above currency name), transaction row (recipient above date meta), header (title above subtitle). Two fixes — pick one per parent:
    - **Wrap each text in its own `Container`** (each becomes block-level), OR
    - **Set the parent `Container.Style` to include BOTH `display-flex flex-direction-column` AND a `row-gap-*` utility** so the texts stack with consistent spacing.
    
    Tripwire: for every `Container` whose direct children include 2+ widgets from {`TextWidget`, `NRWidgetsExpression`, `AdvancedHtml`}, the Container's `Style` must contain `display-flex` AND `flex-direction-column` AND a `row-gap-*` utility. If not, either wrap each text in an inner block-level Container or fix the parent's Style. Verify by reading the parent Container's `Style` after build — string-match each token literally; missing any of the three is a failure.

21. **Horizontal sibling widgets need flex-row-with-column-gap.** The mirror of item 20 for horizontal compositions: when 2+ widgets are intended to sit side-by-side as peers in a row (chrome cluster inside `Common/UserInfo` — search button + theme toggle + bell-badge + welcome text + avatar; quick-actions row of buttons; tag chips beside a title; an icon + label pair next to an action), the parent `Container.Style` MUST contain `display-flex align-items-center` AND a `column-gap-*` utility. Without `display-flex` the gap class is a no-op; without `column-gap-*` the peers render flush against each other with whatever whitespace ODC injects. Most common spacing: `column-gap-s` (8px); `column-gap-base` (16px) when the design has more breathing room. Tripwire: for every `Container` whose direct children are 2+ widgets meant to read as horizontal peers, confirm `display-flex` + `column-gap-*` are both present in `Style`.

22. **No `width: NN%` / `margin: NN%` rules on a block's class root, especially popover/overlay-capable blocks.** Blocks like `UserInfo`, `Sidebar`, `BottomSheet`, `Dropdown`, `FloatingContent`, `Notification` carry MULTIPLE visual states — the top-bar/inline form AND a popover/overlay form (`.user-info[data-popover].popover-bottom` etc.). A theme rule like `.user-info { width: 98%; margin-right: 2%; }` bleeds into ALL states, producing a popover that spans nearly the whole viewport instead of sizing to its content. Two related smells:
    - **`width: 98%` (or any "almost-full-but-not-quite" percentage)** is almost always a wrong workaround for not understanding the box model. Right answers: `full-width` utility (100% with proper box-sizing) on the wrapping `Container`; `max-width: NNNpx` on a constraining child; or just let the block size to its content. Never `width: 98%`.
    - **CSS rules whose selector is `.<block-class-root>`** (`.user-info`, `.sidebar`, `.dropdown`) writing width/margin/position values. Move the rule to a CHILD wrapper (`.user-info > .content-wrapper`) or apply via the block's `ExtendedClass` arg on the *contents*, not the block's root.
    
    Tripwire: read the theme StyleSheet — for every rule whose selector matches a known popover/overlay block class root, the rule body MUST NOT contain `width:` / `margin:` / `margin-right:` / `margin-left:` with percentage values. If found, refactor to one of the patterns above.

If any answer is "no," do another `execute_code` to fix it. Validation passing is necessary but not sufficient — you also need this checklist clean.

## Anti-patterns

❌ Declaring the screen done immediately after `get_validation_errors_and_warnings` returns clean. Validation only checks structure; it can't tell that the screen looks like a wireframe.

❌ Putting all section content directly in `MainContent` without `h2` separators or visible spacing.

❌ Three `Card` blocks each with the same flag-icon-only content, no balance amount, no currency name with proper typography.

❌ Filling a list with one item or zero items when the request implies a populated UI.

❌ "Send money" button is the only colored thing on the screen. Add at least one more deliberate use of the brand color.

❌ Using `Style: "\"margin-top: 20px\""` (custom CSS) instead of `Style: "\"margin-top-l\""` (utility class). The utility class respects the theme's spacing scale; raw CSS doesn't.

❌ A row of 3 / 4 sibling elements wrapped in a `Container` with `display: flex` instead of a `Columns3` / `Columns4` block. The grid block is responsive, theme-aware, and has correct gutter sizing — flex containers have none of that. If you find this in your output, replace the `Container` with the `Columns*` block and put each child in `Column1`, `Column2`, etc.

❌ A "card-shaped" region built from `Container` + `box-shadow` + `border-radius` + `padding` CSS instead of a `Card` block. The `Card` block already has the right shadow, radius, and padding from the theme; the `Container` version drifts from the design system the moment the theme changes.

❌ Overriding a default that didn't need overriding. If `Card`'s default padding works, don't set `UsePadding=False` and rebuild padding via `padding-l` utility. If `Columns3`'s `GutterSize.Base` looks fine, don't bump to `Medium` "to be safe." Defaults are the baseline — every override should be deliberate and visibly improve the result.

❌ Two Layout blocks at the screen root (e.g. `LayoutTopMenu` wrapping a `LayoutSideMenu`) because the design has both a sidebar and a top bar. `LayoutSideMenu` already includes the top bar — use it alone and fill the `Header` placeholder for per-screen middle content. Editing the brand or user widget means editing the Layout block in the app's `Layouts` flow, not adding a second Layout.

❌ Emoji as an icon — `linkText.Value = "\"🏠 Home\""`, currency flag emoji on a balance card, dotted-circle emoji as a status indicator. Real icons go through `IIcon` with a Phosphor name and `IconSize=FontSize`. Emoji don't respect theme color, don't scale with typography, and are inaccessible.

❌ A `Container` styled as a colored circle (the "black circle next to the row label" pattern from screenshot reviews) as a placeholder for an icon. That's fake UI — invisible to assistive tech, breaks under theme changes, looks broken when rendered. Use `IIcon` with a Phosphor name; tint via `text-primary` / `text-success` / etc. utility classes.

❌ Setting `Style` / `CustomStyle` / `SetStyle` / `Width` on the Menu block's `PageLinks` container, or wrapping the nav `ILink` widgets in a custom `Container` inside `PageLinks`. The Menu block's defaults supply the correct padding and spacing — overriding them produces the visual bug where nav items render flush-left against the sidebar edge with no breathing room.

❌ Writing dark-mode / theme-rebrand CSS that uses INVENTED variable names (`--bg-deep`, `--accent`, `--text-primary`) and scopes everything under a wrapper class (`.banking-dark { ... }`). The OutSystems UI widgets render against `var(--color-neutral-0)`, `var(--color-primary)`, `var(--color-background-body)` etc. — they have no way to read invented variable names, and they don't have your wrapper class. The CSS exists in the OML but the visual surface stays the default light theme. Override the EXISTING OS UI variables on the THEME's StyleSheet's `:root` instead. See [`styles-and-utilities.md#theming-the-app-dark-mode-full-rebrand-palette-swap`](styles-and-utilities.md#theming-the-app-dark-mode-full-rebrand-palette-swap).

❌ Putting theme-wide CSS (dark mode, palette overrides) on a SCREEN's `StyleSheet`. Screen stylesheets only apply to that one screen — the rest of the app stays light. Theme-wide CSS belongs on the theme model object: `theme.StyleSheet = "..."`.

❌ Applying `widget.SetStyle("\"<class-name>\"")` for a custom class without confirming `.<class-name>` is actually defined somewhere (theme StyleSheet, screen StyleSheet, or shared block StyleSheet). Undefined class references are silent no-ops — the widget renders with default styling and the visual treatment never appears. **Every custom class you reference MUST have a definition somewhere in the OML**; verify before declaring done.

❌ Using `revert_changes` to recover from a single-step `execute_code` failure, then forgetting to re-verify earlier phase-0 work survived. Revert can wipe theme stylesheets, Menu block edits, default-screen settings, and other prior commits — re-read each artifact after every revert. Better: incrementally fix-forward (read the broken state, patch only the bad parts) rather than rolling back wholesale.

❌ Project-prefixed CSS classes (`hb-stat-card`, `hb-vcard`, `hb-toggle-card`, `my-app-tile`, `<anything>-card` / `-row` / `-tile` / `-pill`) applied to `Container` widgets. The prefix itself isn't the problem — the existence of a project-prefix custom class on a `Container` is a tell that the underlying widget should have been a real OS UI block (`Card`, `CardItem`, `CardSectioned`, `Tag`, `UserAvatar`, etc.). Replace the Container with the matching block; pass any one-off visual treatment via `<Block>.ExtendedClass` arg + a class defined in the theme stylesheet.

❌ Trusting ODC's default `MarginLeft` on `IButton` / `ILink`. ODC injects a non-zero `margin-left` on these widgets that creates phantom whitespace — visible as an icon-button row whose first button is inset from the container edge, or a CTA that won't hug its column. Set `MarginLeft = "0"` explicitly unless the widget's parent is already a flex container with an explicit `column-gap-*`/`row-gap-*` utility (in which case the gap utility owns spacing and `MarginLeft` should be left at its default).

❌ Two `TextWidget` / `Expression` / `AdvancedHtml` widgets as direct siblings inside a plain `Container` (no `display-flex flex-direction-column row-gap-*`) when the design shows them stacked. Text widgets render `inline-block` by default — siblings flow inline on the same baseline and wrap, they do NOT stack vertically with even spacing. Either wrap each text in its own block-level `Container`, or set the parent's `Style` to include `display-flex flex-direction-column row-gap-<size>`.
