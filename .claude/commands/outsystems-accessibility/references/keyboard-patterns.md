# Keyboard Interaction Patterns

Standard keyboard support for common component types. Apply these when generating Web Components or BEM components.

## Button

| Key | Action |
|---|---|
| `Tab` | Move focus to button |
| `Shift+Tab` | Move focus away |
| `Enter` | Activate button |
| `Space` | Activate button |

Use native `<button>` — these are automatic. For custom buttons, implement explicitly.

## Toggle Button (single)

Same as Button, plus:
- Maintains `aria-pressed="true|false"` state
- Visual indication of pressed state (via CSS `[aria-pressed="true"]` selector)

## Toggle Group / Segmented Control

| Key | Action |
|---|---|
| `Tab` | Move focus to selected option (only the selected option is in tab order) |
| `Arrow Left/Up` | Move to previous option, activate it |
| `Arrow Right/Down` | Move to next option, activate it |
| `Home` | Move to first option |
| `End` | Move to last option |

Implement with `role="radiogroup"` containing `role="radio"` elements, or use the native `<input type="radio">` and style accordingly.

## Tabs

| Key | Action |
|---|---|
| `Tab` | Move focus into tab list, then to active panel |
| `Arrow Left/Right` | Move to previous/next tab and activate |
| `Home` | First tab |
| `End` | Last tab |

Markup:
```html
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" tabindex="-1">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">...</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>...</div>
```

## Accordion

| Key | Action |
|---|---|
| `Tab` | Move focus through accordion headers |
| `Enter` or `Space` | Toggle expanded state |

Headers use `<button>` with `aria-expanded="true|false"` and `aria-controls`.

## Modal / Dialog

| Key | Action |
|---|---|
| `Tab` | Cycle focus within modal (focus trap) |
| `Shift+Tab` | Cycle focus backward within modal |
| `Esc` | Close modal |

Requirements:
- Focus moves to modal when opened
- Focus returns to triggering element when closed
- Background content has `aria-hidden="true"` and `inert` when modal is open
- Use `role="dialog"` and `aria-modal="true"`

## Dropdown / Combobox

| Key | Action |
|---|---|
| `Down Arrow` | Open dropdown / move to next option |
| `Up Arrow` | Move to previous option |
| `Enter` | Select highlighted option |
| `Esc` | Close dropdown |
| `Type characters` | Filter/jump to matching option |
| `Home` / `End` | First / last option |

For complex select, refer to WAI-ARIA Combobox pattern.

## Menu / Menubar

| Key | Action |
|---|---|
| `Tab` | Focus to first item |
| `Arrow Right` | Next item (or open submenu) |
| `Arrow Left` | Previous item (or close submenu) |
| `Arrow Down/Up` | Navigate vertical menus |
| `Enter` | Activate item |
| `Esc` | Close menu, return focus to trigger |

## Slider

| Key | Action |
|---|---|
| `Arrow Right/Up` | Increase value |
| `Arrow Left/Down` | Decrease value |
| `Page Up` | Larger increment |
| `Page Down` | Larger decrement |
| `Home` | Minimum value |
| `End` | Maximum value |

Use native `<input type="range">` when possible. For custom Web Component, implement all these handlers.

## Carousel

| Key | Action |
|---|---|
| `Tab` | Focus on carousel container, then on each interactive child |
| `Arrow Left/Right` | Previous / next slide |
| `Space` | Pause / play autoplay |

**Critical:** If carousel auto-rotates, provide pause control (WCAG 2.2.2). Don't auto-rotate without user control.

## Tree / TreeView

| Key | Action |
|---|---|
| `Arrow Down/Up` | Next / previous visible node |
| `Arrow Right` | Expand collapsed node, or move to first child if expanded |
| `Arrow Left` | Collapse expanded node, or move to parent |
| `Enter` | Activate node |
| `Home` / `End` | First / last visible node |

## Pin/Code Input (multi-field)

| Key | Action |
|---|---|
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| Type a character | Fill current field, auto-advance |
| `Backspace` on empty field | Go to previous field |
| `Paste` (full code) | Distribute across fields |

## Drag handle alternative (WCAG 2.2 SC 2.5.7)

Whenever a component supports dragging, also support:
- `Tab` to focus the draggable item
- `Space` to "pick up" the item
- `Arrow keys` to move
- `Space` again to drop
- `Esc` to cancel

Or provide buttons (move up, move down) as a simpler alternative.

## Implementation in Web Components

When generating a Web Component, add keyboard handlers in `connectedCallback`:

```javascript
connectedCallback() {
  this.render();
  this.addEventListener('keydown', this._handleKeydown);
}

_handleKeydown = (e) => {
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      this._focusNext();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      this._focusPrevious();
      break;
    case 'Home':
      e.preventDefault();
      this._focusFirst();
      break;
    case 'End':
      e.preventDefault();
      this._focusLast();
      break;
    case 'Escape':
      this._handleEscape();
      break;
  }
};
```
