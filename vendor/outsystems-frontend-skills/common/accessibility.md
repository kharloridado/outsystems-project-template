---
name: outsystems-accessibility
description: WCAG 2.1 AA accessibility rules for OutSystems apps — Label-Input association, alt text, focus management, keyboard interactions, semantic HTML. Use when reviewing a screen for accessibility, fixing a11y bugs, or designing screens for inclusive use.
---

# Accessibility in OutSystems Apps

> **Goal:** ship apps that meet WCAG 2.1 AA without writing custom ARIA from scratch. OutSystems UI patterns handle most of the work — your job is to use them correctly and not undo their built-in behavior.

## The cheap wins (always do these)

1. **Use OutSystems UI patterns, not custom HTML.** Patterns ship with proper roles, ARIA attributes, focus management, and keyboard support. Custom widgets do not.
2. **Use the right widget for the job.**
   - Form inputs → `Input` / `TextArea` / `Checkbox` / `Switch` / `RadioButton` / `Dropdown`.
   - Action triggers → `Button` (or `Link` for navigation).
   - Headings → `AdvancedHtml` with `Tag: "h1"`–`"h6"` (don't fake headings with styled text).
   - Group form fields → `Fieldset` pattern if available, or use `AdvancedHtml` with html5 `fieldset`
3. **Pair every `Input` with a `Label` whose `TargetWidget` matches the input's `Name`.** No exceptions — this is the single most common a11y bug.
4. **Provide `alt` text on every `ImageWidget`.** Decorative images get `alt: ""`; meaningful images describe the content (`alt: "Profile photo of " + UserName`).
5. **Don't disable focus outlines.** If the design objects to the default ring, replace it with a different focus style — never delete it.

## Forms and inputs

### Label association

Every editable input MUST have an associated `Label`:

```jsonc
{ "Object": "Label", "TargetWidget": "Input_FirstName",
  "content": [{ "Object": "TextWidget", "Text": "First Name" }] },
{ "Name": "Input_FirstName", "Object": "Input",
  "Variable": "Agg.List.Current.Entity.FirstName", "InputType": "Text" }
```

Without `TargetWidget`, screen readers announce "edit text" with no context.

### Validation messages

OutSystems Form validation surfaces messages automatically. To override messages, use the `ValidationMessage` property on the `Input` or set it from a server action via `Form1.SetValidationMessage(…)`. Don't rely on visual-only red borders.

### Required fields

Set `Mandatory: "True"` on the `Input`. The pattern adds `aria-required="true"` and the visual asterisk. Never use a custom asterisk in the label text — screen readers won't connect it to the input.

### Disabled vs read-only

- **Disabled** (`Enabled: "False"`) — input is non-interactive and non-focusable. Use sparingly; communicate *why* in adjacent text.
- **Read-only** (use `Expression` or `Input` with `Style: "\"form-control read-only\""`) — input is focusable but not editable. Better for displaying values that the user can copy.

### Fieldsets and grouping

Use the `Fieldset` pattern from OutSystems UI for grouped fields (address blocks, billing/shipping). It exposes a `<legend>` that describes the group to screen readers.

## Buttons and links

| Use | Widget | Why |
|---|---|---|
| Trigger an action on the same page | `Button` | Default `<button>` semantics. |
| Navigate to another screen or URL | `Link` | Default `<a>` semantics. |
| Trigger a destructive action | `Button` with `Style: "\"btn btn-destructive\""` | Color + label communicate intent; don't rely on color alone. |

A common mistake: using a `Link` styled as a button for an action (e.g., delete). Screen reader users hear "link" and expect navigation. Use `Button` for actions.

Always provide visible text — never an icon-only button without an `aria-label`. If the button is icon-only, set the title:

```jsonc
{ "Object": "Button", "Style": "\"btn btn-icon\"",
  "ExtendedProperties": [{ "Property": "aria-label", "Value": "\"Close\"" }],
  "content": [{ "Object": "Icon", "Icon": "close" }] }
```

## Images and icons

### Meaningful images

`ImageWidget` exposes `AltText`. Set it to describe the image's purpose:

```jsonc
{ "Object": "ImageWidget", "Image": "ProductHero",
  "AltText": "Hero photo of the product on a wooden table" }
```

### Decorative images

Set `AltText: ""` (empty string, NOT omitted) so screen readers skip:

```jsonc
{ "Object": "ImageWidget", "Image": "DecorativePattern", "AltText": "" }
```

### Icon-only navigation

When using icons in lists or menus without labels, wrap them in a Link/Button with `aria-label`:

```jsonc
{ "Object": "Link",
  "ExtendedProperties": [{ "Property": "aria-label", "Value": "\"Edit user\"" }],
  "content": [{ "Object": "Icon", "Icon": "edit" }] }
```

### `InlineSVG`

If the SVG conveys meaning, set `role="img"` and `aria-label` inside the `SVGCode`. If decorative, set `aria-hidden="true"`.

## Color and contrast

- WCAG AA requires 4.5:1 contrast for normal text, 3:1 for large text (≥18pt or ≥14pt bold).
- The default OutSystems UI palette satisfies AA when used as designed (`text-default` on `bg-body`, `text-primary` on `bg-primary` light variants, …).
- **Don't communicate state with color alone.** Errors should be red AND have an icon AND have text. Use the `Alert` pattern with `AlertType: Entities.Alert.Error` — it does all three.
- When customizing tokens (see [`css-customization.md`](./css-customization.md)), check contrast pairs after the override. Tools: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/), browser DevTools color picker.

## Focus management

### Visible focus

Don't override `:focus { outline: none }` without a replacement. If the default ring clashes with the design, supply a custom focus style:

```css
*:focus-visible {
  outline: 2px solid var(--token-border-focus-default);
  outline-offset: 2px;
}
```

Use `:focus-visible` (not `:focus`) to scope to keyboard-only focus, so mouse users don't see rings.

### Focus order

OutSystems UI patterns maintain logical focus order based on DOM order. Don't use CSS `order` or absolute positioning to visually reorder elements without also reordering them in the DOM — visual and focus order will diverge.

### Focus traps in modals

`Popup`, `Sidebar`, `BottomSheet`, and `ActionSheet` automatically trap focus while open and restore it to the trigger on close. **Don't manually move focus** inside or outside these — you'll break the trap.

### Skip links

Add a "Skip to main content" link as the first focusable element in the layout. If using OutSystemsUI, The `LayoutTopMenu` includes one by default — keep it.

## Keyboard interactions

OutSystems UI patterns implement standard keyboard interactions:

| Pattern | Keys |
|---|---|
| `Tabs` | ←/→ to move between tabs, Enter/Space to activate. |
| `Accordion` | Tab to focus an item, Enter/Space to expand/collapse. |
| `Carousel` | ←/→ to advance slides when focused. |
| `RangeSlider` | ←/→ to step, Home/End to jump to min/max. |
| `Dropdown`/`DropdownSearch` | ↓ opens, ↑/↓ navigates options, Enter selects, Esc closes. |
| `Popup`/modals | Esc to close. |

Don't reimplement these by hand. If you do build a custom Block with similar behavior, match the keyboard contract.

## Page structure (semantic HTML)

| What | Use |
|---|---|
| Page title | `AdvancedHtml Tag: "h1"` in the Layout's `Title` placeholder. **One per screen.** |
| Section heading | `AdvancedHtml Tag: "h2"`–`"h6"`, in document order. **Don't skip levels.** |
| Main content area | The `MainContent` placeholder of the layout (renders as `<main>`). |
| Navigation | The `Header` placeholder + `Menu` block (renders as `<nav>`). |
| Footer | The `Footer` placeholder. |
| Lists of items | `IList` (`<ul>`/`<ol>`) — not styled `Container`s. |
| Tabular data | `TableRecords` — not nested `Container`s pretending to be a table. |

## Accessibility for lists

When list items don't have descriptive text (icon-only, image-only, or short text):

```jsonc
{ "Object": "Link",
  "ExtendedProperties": [{ "Property": "aria-label", "Value": "\"Open \" + Item.Name" }],
  "content": [{ "Object": "ImageWidget", "Image": "Item.Thumbnail", "AltText": "" }] }
```

Set `aria-label` on the wrapping Link/Button — not on the image itself.

## Accessibility for charts

Charts are visual. Pair them with:

1. A textual summary above or below the chart (e.g., "Sales increased 12% from Q3 to Q4").
2. A data table fallback (`TableRecords` showing the same data) toggleable by a button.
3. `aria-label` on the chart container describing what the chart represents.

The OutSystems Charts component supports accessible defaults — see [`ui-components/outsystems-charts/`](../ui-components/outsystems-charts/).

## Testing accessibility

OutSystems recommends running automated checks with [WAVE](https://wave.webaim.org/extension/) or [axe DevTools](https://www.deque.com/axe/devtools/) early in development. Manual checks to add:

1. **Keyboard-only run-through** — Tab through every interactive element. Can you reach and use them all?
2. **Screen reader** — Use VoiceOver (macOS), NVDA (Windows), or TalkBack (Android). Are widgets announced meaningfully?
3. **Zoom to 200%** — Does the layout still work? Are text and controls still usable?
4. **Disable color** — Browser DevTools "Emulate vision deficiencies → Achromatopsia". Is state still communicable?

## Anti-patterns

- **Removing focus outlines globally** without a replacement.
- **Icon-only buttons without `aria-label`.**
- **Using color alone** to indicate state (errors, success, required).
- **Faking semantic elements** with styled `Container`s — use the right widget.
- **Skipping heading levels** (`h1` → `h3`).
- **Missing `alt` on `ImageWidget`** (or omitting it entirely vs. setting empty string for decorative).
- **Manually managing focus** inside patterns that already handle it (modals, tabs, accordions).
- **Custom dropdowns/modals/tabs** built from `Container`s instead of using OutSystems UI patterns.

## Source

OutSystems publishes [Accessibility in OutSystems Apps](https://success.outsystems.com/Documentation/11/Developing_an_Application/Design_UI/Accessibility) and a per-pattern [UI Patterns accessibility reference](https://success.outsystems.com/Documentation/11/Developing_an_Application/Design_UI/Accessibility/UI_Patterns_accessibility_reference). The patterns cited above match those references.
