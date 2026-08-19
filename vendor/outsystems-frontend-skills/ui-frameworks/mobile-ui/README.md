---
name: mobile-ui-framework
description: OutSystems Mobile UI — the Ionic+React widget framework for ODC Mobile UI Template apps (separate stack from OutSystems UI). Widget catalog (~44 widgets), property model (TypeScript interfaces code-generated from Widgets.xml), nesting rules. Use when building ODC native-shell mobile apps, NOT Reactive Web or Phone App Template screens.
---

# Mobile UI

> **Asset:** OutSystems Mobile UI — the Ionic-based UI framework for ODC mobile apps.
> **Type:** UI framework (separate from OutSystems UI).
> **Scope:** ODC Mobile Apps using the **Mobile UI Template**.
> **Stack:** React + Ionic Framework, design-time integrated into ODC Studio.

## What it is

Mobile UI is the dedicated mobile-app UI framework in ODC. It is **not** part of OutSystems UI — it's a separate stack:

- **Runtime:** React component wrappers around Ionic Framework primitives (`IonButton`, `IonInput`, `IonModal`, …). Open-source repo: [OutSystems/runtime-mobile-widgets-js](https://github.com/OutSystems/runtime-mobile-widgets-js).
- **Design-time:** Widget descriptors defined in `Common/Widgets.xml` and consumed by ODC Studio. Repo: [OutSystems/OutSystems.WidgetLibrary](https://github.com/OutSystems/OutSystems.WidgetLibrary).
- **Result:** dropped into ODC Studio as **widgets** (not blocks) that compile down to native-feeling mobile chrome at runtime.

The two repos work together: `Widgets.xml` defines schemas → `runtime-mobile-widgets-js` implements the runtime React components → ODC Studio consumes both via the `MobileUI` plugin.

## Mobile UI vs OutSystems UI — pick the right stack

OutSystems gives you two distinct UI frameworks for mobile apps. Both *can* be used in either context, but the templates pre-load only the patterns/widgets that fit the stack:

| | **Mobile UI** | **OutSystems UI** (Phone App Template) |
|---|---|---|
| Template | Mobile UI Template (ODC) | Phone App Template (ODC / O11) |
| Underlying tech | Ionic Framework + React | OutSystems Reactive Web stack |
| Building blocks | **Widgets** (`Button`, `Modal`, `Card`, …) | **Patterns** (`UIBlockInstanceWidget`, e.g. `BottomSheet`, `Sidebar`, `Card`) |
| Property model | TypeScript interfaces (`IButtonProperties`), camelCase props | OutSystems block arguments, PascalCase params, FULL PATH (`Card.UsePadding`) |
| Native feel | Strong — Ionic primitives match iOS/Android conventions | Good — responsive web rendered in a WebView |
| Authoring API | Widget instances in ODC Studio | `IMobileBlockInstanceWidget` in modelAPI |

**Rule of thumb:**

- The user is building a new **ODC mobile app** with native chrome → use **Mobile UI**.
- The user is building a **Phone App Template** (ODC Reactive Web on phones) or a Reactive Web app that should also work on phones → use **OutSystems UI** ([../outsystems-ui/](../outsystems-ui/)).
- The user already has a Mobile UI app and adds a screen → stay on Mobile UI; don't mix the two stacks.

OutSystems UI patterns will technically work in a Mobile UI app and vice-versa, but each template ships only the components that make sense for its stack. Mixing creates inconsistent UX and bigger bundles.

## Widget categories

Mobile UI ships ~44 widgets, code-generated from `Common/Widgets.xml`. Approximate groupings (Mobile UI doesn't enforce official categories the way OutSystems UI does):

### Layout & structure

| Widget | Purpose |
|---|---|
| `Layout` | Page-level layout shell (header / content / footer). |
| `TopBar` | Top navigation bar with title + actions. |
| `BottomBar` / `BottomBarItem` | Persistent bottom tab bar. |
| `SideMenu` / `SideMenuItem` | Slide-out side drawer. |
| `Tabs` / `TabsHeaderItem` / `TabsContentItem` | Tabbed content switcher. |
| `AccordionGroup` / `AccordionItem` | Collapsible sections. |
| `Card` | Content surface (header / content / footer / background-image placeholders). |
| `Columns` / `ColumnItem` | Column-grid layout. |
| `Divider` | Horizontal/vertical separator. |
| `MenuIcon` | Hamburger / close icon for SideMenu. |

### Form input

| Widget | Purpose |
|---|---|
| `Input` | Single-line text input. Supports text, email, password, number, etc. via `inputType` enum. |
| `InputOTP` | One-time-password segmented input. |
| `Textarea` | Multi-line input. |
| `Checkbox` | Boolean toggle (square). |
| `Switch` | Boolean toggle (sliding). |
| `RadioButton` / `RadioGroup` | Single-choice. |
| `Dropdown` / `DropdownMenu` | Select from list. |
| `Datepicker` | Date / time picker (Ionic-native). |
| `RangeSlider` | Numeric range slider (one or two handles). |
| `Button` / `ButtonGroup` / `ButtonGroupItem` | Action triggers. |

### Feedback & display

| Widget | Purpose |
|---|---|
| `Avatar` | User profile image / initials fallback. |
| `Badge` | Numeric or status badge. |
| `Tag` | Inline label / chip. |
| `Carousel` | Horizontal swipeable slides. |
| `Icon` | Icon glyph from Mobile UI icon set. |
| `Image` | Image (static, binary, external). |
| `List` / `ListItem` / `ListSwipeAction` | Repeatable list with swipeable row actions. |
| `Modal` | Modal dialog (header / content / footer placeholders). |
| `BottomSheet` | Slide-up panel from the bottom. |
| `Notification` | Toast notification. |
| `ProgressBar` | Linear progress indicator. |
| `Spinner` | Indeterminate loading indicator. |
| `Text` | Styled text widget (typography presets). |

For an exhaustive per-widget property list, the **source of truth** is `src/generated/<Widget>.Generated.ts` in [runtime-mobile-widgets-js](https://github.com/OutSystems/runtime-mobile-widgets-js/tree/main/src/generated). Every widget has a generated TypeScript interface (`IButtonProperties`, `IModalProperties`, …) that lists every property, its type, and its enum values.

## Widget property model

Mobile UI widgets are React components. Their properties are **code-generated TypeScript interfaces** — never edited by hand. Each widget exposes:

- **Properties** — primitives (`label: string`, `enabled: boolean`), enum values (`buttonShape: ButtonShape`), or wrapped variables (`isOpen: DataTypes.IVariable<boolean>` for two-way binding).
- **Event callbacks** — `() => void` props like `onTap`, `onDismiss`, `onToggle`.
- **Placeholders** — typed structure of named slots, e.g. `IModalPlaceholders { header, content, footer }`.

### Modal (representative example)

From `runtime-mobile-widgets-js/src/generated/Modal.Generated.ts`:

```typescript
export enum ModalShape { Round, Soft, Rectangular }

export interface IModalPlaceholders {
  header: Widget.PlaceholderContent;
  content: Widget.PlaceholderContent;
  footer: Widget.PlaceholderContent;
}

export interface IModalProperties extends Widget.IWidgetProperties {
  isOpen: DataTypes.IVariable<boolean>;       // two-way bound
  hasBackdrop: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
  closeButton: boolean;
  modalShape: ModalShape;
  style: string;                               // CSS class string
  onToggle: () => void;                        // fires when the user dismisses
  placeholders: IModalPlaceholders;
  expandedInWebEditor?: boolean;               // design-time hint
}
```

### Card (placeholders + flags)

```typescript
export enum CardShape { Soft, Round, Rectangular }

export interface ICardPlaceholders {
  header: Widget.PlaceholderContent;
  content: Widget.PlaceholderContent;
  footer: Widget.PlaceholderContent;
  backgroundImage: Widget.PlaceholderContent;
}

export interface ICardProperties extends Widget.IWidgetProperties {
  cardHasHeader: boolean;       // toggles each placeholder's visibility
  cardHasContent: boolean;
  cardHasFooter: boolean;
  cardHasBackgroundImage: boolean;
  dismissible: boolean;
  cardShape: CardShape;
  style: string;
  onDismiss: () => void;
  placeholders: ICardPlaceholders;
}
```

### Button (rich enum surface)

`Button` exposes ~20 properties spanning structure, icon, badge, fill style, color, size, shape:

```typescript
export enum ButtonStructure { LabelOnly, LabelAndIcon, IconOnly, Custom }
export enum ButtonFill      { Filled, Outlined, Ghost }
export enum ButtonColor     { Primary, Neutral, Success, Danger, Warning }
export enum ButtonSize      { Small, Medium, Large }
export enum ButtonShape     { Round, Soft, Rectangular }

interface IButtonProperties extends Widget.IWidgetProperties {
  buttonStructure: ButtonStructure;
  label: string;
  icon: string;
  buttonIconPlacement: ButtonIconPlacement; // Start | End
  submitForm: boolean;
  enabled: boolean;
  isLoading: boolean;
  buttonSpinner: ButtonSpinner;             // Default | Dots | Lines | Circle | …
  hasIconBadge: boolean;
  buttonBadge*: …;                           // badge subgroup
  buttonFill: ButtonFill;
  buttonColor: ButtonColor;
  buttonSize: ButtonSize;
  buttonShape: ButtonShape;
  /* … */
}
```

The full type list is in `src/generated/Button.Generated.ts`. Don't memorize it — read the generated file when you need it.

## Widget hierarchy and code patterns

Each widget follows a three-class pattern (enforced by tenet T2 in the runtime repo's [ARCHITECTURE.md](https://github.com/OutSystems/runtime-mobile-widgets-js/blob/main/ARCHITECTURE.md)):

```
AbstractButton.tsx       — shared rendering logic, extends AbstractWidget
ButtonRuntime.tsx        — user-facing behavior, calls executeAction()
ButtonDesignTime.tsx     — preview-only, no action execution
```

When the agent's task is to add a widget to a screen, it doesn't write React — it produces a model patch for ODC Studio that references the widget by name and sets its properties. The runtime React class is plumbing.

## Action execution

Widget event callbacks must be invoked through `this.executeAction(callback)` — never directly. This ensures visual feedback (active class) and proper error handling.

```tsx
// ✅ Correct
<IonButton onClick={() => this.executeAction(this.props.onTap)}>

// ❌ Wrong — bypasses framework
<IonButton onClick={this.props.onTap}>
```

This is enforced by tenet T4 in the runtime repo. Custom widgets that don't follow this pattern cause silent UX bugs.

## Widget nesting rules

Mobile UI enforces nesting restrictions in the design-time descriptors:

- `IsAllowedIn()` — controls where a widget can be placed.
- `AllowsChild()` — controls what children a widget accepts.
- `IInteractiveWidgetDescriptor` — marks widgets as interactive.

**Interactive widgets cannot be nested inside other interactive widgets.** A `Button` can't contain another `Button`; a `ListItem` can't contain a clickable `Card` that has its own click action.

The full rules are in [docs/adr/001-widget-nesting-and-interactive-restrictions.md](https://github.com/OutSystems/OutSystems.WidgetLibrary/blob/main/docs/adr/001-widget-nesting-and-interactive-restrictions.md) of the WidgetLibrary repo.

## Design tokens

Mobile UI uses the same [design token system](../../foundations/outsystems-design-tokens/design-tokens.md) as OutSystems UI. Token CSS variables (`--token-*`) are emitted into Mobile UI's CSS bundles and consumed by Ionic primitives. Override tokens at the theme level to rebrand without touching widget code.

The runtime repo runs `npm run tokens:update` to sync from `outsystems-design-tokens`.

## Customizing styles

Each widget exposes a `style` property — a string of CSS class names applied to the root element:

```typescript
{ "style": "shadow-s margin-bottom-base custom-product-card" }
```

For deeper customization:

- Add CSS classes via `style` (token-driven utility classes).
- Define new classes in the app's theme or a custom CSS asset.
- Don't fork the widget code — extend via composition or wrap in a new widget.

See [`../../common/css-customization.md`](../../common/css-customization.md) for token-override and CSS-scoping rules. The same principles apply to Mobile UI.

## Anti-patterns

- **Mixing Mobile UI widgets and OutSystems UI patterns** in the same screen of the same template. Stick to one stack.
- **Editing files in `src/generated/`** of the runtime repo. They're code-generated; the source of truth is `Widgets.xml` in WidgetLibrary.
- **Calling event callbacks directly** instead of via `executeAction()`. Breaks framework error handling.
- **Nesting interactive widgets** (Button inside Button, clickable Card inside ListItem with its own action). Violates nesting rules.
- **Building custom mobile chrome** (top bar, bottom bar, side menu) when `TopBar` / `BottomBar` / `SideMenu` widgets exist.
- **Treating Mobile UI widget properties like OutSystems UI block arguments.** They're camelCase TypeScript props, not FULL-PATH PascalCase strings.

## Reference

- **Runtime widgets repo (Ionic + React):** [OutSystems/runtime-mobile-widgets-js](https://github.com/OutSystems/runtime-mobile-widgets-js)
  - `src/generated/` — TypeScript interfaces for every widget's properties (the source of truth for property names, types, and enum values).
  - `src/scripts/Components/` — runtime React implementations.
  - `ARCHITECTURE.md` — five architectural tenets (dual builds, widget hierarchy, code-generated properties, action execution, Ionic wrapping).
- **Widget library repo (descriptors + IDE integration):** [OutSystems/OutSystems.WidgetLibrary](https://github.com/OutSystems/OutSystems.WidgetLibrary)
  - `Common/Widgets.xml` — single source of truth for widget schemas (properties, events, placeholders, nesting rules).
  - `ServiceStudio/Widgets/` — design-time descriptors (40+ widgets).
  - `docs/adr/001-widget-nesting-and-interactive-restrictions.md` — nesting rules.
- **Phone App Template (OutSystems UI on mobile):** [`../outsystems-ui/`](../outsystems-ui/) — the alternative stack, when the app is Reactive-Web-style on phones rather than native-shell.

## Related

- [Design Tokens architecture](../../foundations/outsystems-design-tokens/design-tokens.md) — shared with OutSystems UI.
- [CSS customization](../../common/css-customization.md) — same principles apply.
- [Accessibility](../../common/accessibility.md) — Ionic widgets have built-in a11y; same anti-patterns to avoid.
- [Responsive design](../../common/responsive-design.md) — Mobile UI is mobile-first; responsive guidance is mostly for OutSystems UI Reactive Web.
