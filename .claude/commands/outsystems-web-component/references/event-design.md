# Event Design for OutSystems Web Components

Events are the bridge between your Web Component and OutSystems Client Actions. Get this right and integration is seamless.

## The golden rule

```javascript
this.dispatchEvent(new CustomEvent('event-name', {
  detail: { /* payload */ },
  bubbles: true,
  composed: true   // ← MUST be true to cross Shadow DOM
}));
```

Without `composed: true`, OutSystems can't catch the event from outside the Web Component.

## Naming conventions

### Use lowercase, kebab-case (CustomEvent standard)
- ✅ `change`, `submit`, `value-change`, `selection-change`
- ❌ `onChange`, `valueChange`, `OnChange`

### Match HTML conventions when possible
Standard event names that OutSystems devs already know:
- `change` — value changed (after commit, e.g., after blur)
- `input` — value changed (during typing)
- `submit` — form submitted
- `focus` / `blur` — focus state changed
- `click` — clicked (rarely needed; click bubbles natively)

### For component-specific actions, use noun-verb
- `tier-selected` (not `select`)
- `slide-changed` (not `change`, which is too generic)
- `modal-closed` (not `close`)

## Payload design (`detail` object)

### Always include enough context to be useful
```javascript
// ❌ Useless
this._emit('change');

// ❌ Almost useless
this._emit('change', this.value);

// ✅ Complete
this._emit('change', {
  value: this.value,
  previousValue: this._previousValue,
  source: 'user'  // vs 'programmatic'
});
```

### Match OutSystems' expectations for common types

OutSystems Client Action event handlers receive parameters. Design your `detail` to match.

```javascript
// For a value-change event
detail: { value: 42 }

// For a selection event with index + item
detail: { index: 0, item: {...}, items: [...] }

// For a form-style submit
detail: { values: { field1: 'abc', field2: 123 }, isValid: true }
```

## Wiring events in OutSystems Block

### Pattern: Block Event per Web Component event

For each event your component fires, create a Block Event in the wrapper:

```
Block: PricingToggle
Block Events:
  - OnChange (parameters: Value)
  - OnSubmit
```

### Pattern: Wire in OnReady Client Action

```javascript
// In Block's OnReady Client Action — JavaScript node
const widget = $parameters.WidgetRoot.querySelector('acme-pricing-toggle');

widget.addEventListener('change', function(e) {
  $actions.OnChange(e.detail.value);
});

widget.addEventListener('submit', function(e) {
  $actions.OnSubmit();
});
```

### Pattern: Clean up in OnDestroy

OutSystems components have an OnDestroy lifecycle. Remove listeners to prevent leaks:

```javascript
// In OnDestroy Client Action
const widget = $parameters.WidgetRoot.querySelector('acme-pricing-toggle');
widget.removeEventListener('change', /* same reference */);
```

Best practice: define handlers as named functions stored on `widget._handlers` so you can remove them by reference.

## Bidirectional binding (two-way data flow)

If the component has a value that OutSystems variables should stay in sync with:

### One-way: OutSystems → Component
Use attribute binding in Block markup:
```html
<acme-toggle checked="{$parameters.IsChecked}">
```
When OutSystems variable changes, the attribute updates, `attributeChangedCallback` fires.

### One-way: Component → OutSystems
Fire an event with the new value:
```javascript
this._emit('change', { value: this.value });
```
Block's `OnChange` event updates the OutSystems variable via the Assign node.

### Two-way: Both
Combine both. The component fires `change` → OutSystems variable updates → Block re-renders with new attribute → component sees new attribute → renders.

⚠️ Watch for infinite loops: if your `attributeChangedCallback` emits an event, and the event updates the attribute, you'll loop. Guard against it:
```javascript
attributeChangedCallback(name, oldValue, newValue) {
  if (oldValue === newValue) return;  // ← prevent loop
  // ...
}
```

## Event timing

### Fire `input` for every keystroke, `change` for commits
This matches HTML form input behavior and is what OutSystems devs expect.

### Use `requestAnimationFrame` for visual state events
If an event fires "the modal is fully open" or "the animation completed", time it after the next paint:
```javascript
open() {
  this._isOpen = true;
  this.render();
  requestAnimationFrame(() => {
    this._emit('opened');
  });
}
```

### Avoid emitting during construction
```javascript
constructor() {
  super();
  this._emit('ready');  // ❌ Nothing is listening yet
}

connectedCallback() {
  // Wait for next microtask so listeners attached in same tick can catch it
  queueMicrotask(() => this._emit('ready'));
}
```

## Event hierarchy

Avoid emitting too many events. Each event should be meaningful.

### Good event vocabulary for a Modal component
- `open` — about to open (cancelable via `event.preventDefault()`)
- `opened` — fully open (animations done)
- `close` — about to close (cancelable)
- `closed` — fully closed

### Bad event vocabulary
- `change`, `update`, `state-change`, `render`, `tick` — too vague, too noisy

## Cancelable events

Standard HTML pattern — let OutSystems Client Actions prevent the action:

```javascript
const event = new CustomEvent('close', {
  detail: {},
  bubbles: true,
  composed: true,
  cancelable: true  // ← key
});

this.dispatchEvent(event);

if (event.defaultPrevented) {
  return;  // OutSystems caller said no
}

// Proceed with close
this._actuallyClose();
```

OutSystems can call `event.preventDefault()` in the handler to abort.
