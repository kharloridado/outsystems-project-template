# WCAG 2.2 AA Component Review Checklist

Use this for every component review. Items marked **NEW in 2.2** are recent additions worth special attention.

## Perceivable

### 1.3.1 Info and Relationships (A)
- [ ] Headings use proper hierarchy (`<h1>` → `<h2>` → `<h3>`, no skipping)
- [ ] Lists use `<ul>`, `<ol>`, `<dl>` (not styled `<div>`s)
- [ ] Form labels are associated with inputs (`for`/`id` or wrapping)
- [ ] Tables use `<th>` for headers with `scope` attribute
- [ ] Visual relationships match programmatic ones

### 1.3.5 Identify Input Purpose (AA)
- [ ] Inputs use `autocomplete` attribute when applicable (name, email, address, etc.)

### 1.4.3 Contrast (Minimum) (AA)
- [ ] Normal text: 4.5:1 against background
- [ ] Large text (18pt+ or 14pt+ bold): 3:1 against background
- [ ] Validated for default state AND all interactive states

### 1.4.4 Resize Text (AA)
- [ ] Text scales to 200% without loss of content or function
- [ ] Use `rem`/`em` for font sizes (not just `px`)

### 1.4.10 Reflow (AA)
- [ ] Content reflows at 320 CSS pixels wide without horizontal scrolling
- [ ] (Exception: data tables, maps, complex visualizations)

### 1.4.11 Non-text Contrast (AA)
- [ ] UI components (buttons, inputs, controls): 3:1 against adjacent colors
- [ ] Required visual information (icons, graph elements): 3:1
- [ ] Focus indicators meet 3:1 against background

### 1.4.12 Text Spacing (AA)
- [ ] Component allows: line height 1.5×, paragraph spacing 2×, letter spacing 0.12×, word spacing 0.16×
- [ ] No content lost or function broken when these are applied

### 1.4.13 Content on Hover or Focus (AA)
- [ ] Hover/focus-triggered content is dismissible (Esc), hoverable (cursor can move to it), and persistent (until dismissed)

## Operable

### 2.1.1 Keyboard (A)
- [ ] All functionality available via keyboard
- [ ] No keyboard trap (Tab can move away from any element)

### 2.1.4 Character Key Shortcuts (A)
- [ ] Single-character shortcuts can be turned off, remapped, or activated only on focus

### 2.4.3 Focus Order (A)
- [ ] Tab order is logical (typically left-to-right, top-to-bottom)
- [ ] No `tabindex` values > 0 (except specific exceptions)

### 2.4.7 Focus Visible (AA)
- [ ] Every focusable element has a visible focus indicator
- [ ] Use `:focus-visible` to avoid showing on mouse click
- [ ] Indicator is at least 2px thick

### 2.4.11 Focus Not Obscured (Minimum) (AA) — **NEW in 2.2**
- [ ] Focused element is not entirely hidden by author-created content (sticky headers, modal overlays, etc.)
- [ ] When scrolling, focused elements remain at least partially visible

### 2.4.13 Focus Appearance (AAA, but recommended) — **NEW in 2.2**
- [ ] Focus indicator has area ≥ 2px outline OR enclosing the element
- [ ] Focus indicator has 3:1 contrast against unfocused state

### 2.5.7 Dragging Movements (AA) — **NEW in 2.2**
- [ ] Any drag interaction has a single-pointer alternative (click-to-position, buttons, keyboard arrows)
- [ ] Exceptions: drawing tools, signature pads

### 2.5.8 Target Size (Minimum) (AA) — **NEW in 2.2**
- [ ] Pointer target ≥ 24×24 CSS pixels
- [ ] Exceptions: inline links in text, user-set sizes, equivalent alternatives nearby
- [ ] Recommended: 44×44 for primary touch targets

## Understandable

### 3.1.2 Language of Parts (AA)
- [ ] Foreign language phrases use `lang` attribute

### 3.2.3 Consistent Navigation (AA)
- [ ] Navigation appears in the same relative order on every page

### 3.2.4 Consistent Identification (AA)
- [ ] Components with the same function have the same label/icon

### 3.2.6 Consistent Help (A) — **NEW in 2.2**
- [ ] Help mechanisms (contact, chat, FAQ, etc.) appear in the same relative location on every page

### 3.3.1 Error Identification (A)
- [ ] Form errors are identified in text (not color alone)
- [ ] Errors are associated with the input (`aria-describedby`)

### 3.3.3 Error Suggestion (AA)
- [ ] Error messages suggest how to correct the input

### 3.3.4 Error Prevention (Legal, Financial, Data) (AA)
- [ ] Submissions are reversible, checkable, or confirmable

### 3.3.7 Redundant Entry (A) — **NEW in 2.2**
- [ ] Information already entered in the same process is auto-populated or selectable
- [ ] Exceptions: re-entering for security verification, info that's expired

### 3.3.8 Accessible Authentication (Minimum) (AA) — **NEW in 2.2**
- [ ] Authentication doesn't require remembering, transcribing, or pattern-matching unless an alternative exists
- [ ] Browser password managers and pasting are not blocked
- [ ] If CAPTCHA is used, an alternative is provided (audio, etc.)

## Robust

### 4.1.2 Name, Role, Value (A)
- [ ] All interactive elements have an accessible name
- [ ] Roles are correct (native or via ARIA)
- [ ] States are programmatically determinable (`aria-pressed`, `aria-expanded`, etc.)

### 4.1.3 Status Messages (AA)
- [ ] Status/notification updates use `role="status"` or `role="alert"` (or `aria-live`)
- [ ] Don't require focus to be announced

## How to use this checklist

For each component generated:
1. Walk down the list
2. Mark each item ✅ / ⚠️ / ❌ / N/A
3. Include the result in the Style Guide doc's Accessibility section
4. Address all ❌ before marking the component Approved
