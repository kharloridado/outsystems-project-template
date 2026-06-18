# Shadow DOM Gotchas in OutSystems Context

Things that work differently inside Shadow DOM. Read this before debugging.

## CSS

### ✅ CSS custom properties pass through
OutSystems Theme `:root` variables work inside Shadow DOM:
```css
:host {
  color: var(--color-primary);  /* ← reads from outer :root */
}
```

### ❌ Regular CSS doesn't penetrate
OutSystems Theme styles like `.osui-card { ... }` cannot reach inside your Shadow DOM. That's the whole point of Shadow DOM — and it's a feature, not a bug.

### ✅ The `::slotted()` selector styles slotted content
When OutSystems content is projected via `<slot>`, you can style it from inside the Shadow DOM, but only one level deep:
```css
::slotted([slot="header"]) { font-weight: bold; }  /* ✅ */
::slotted(div p) { color: red; }                   /* ❌ only direct children */
```

### ⚠️ Global stylesheets don't reach Shadow DOM
If you load a separate `.css` file in OutSystems Scripts, it won't style your Web Component internals. All component CSS must be inside the `<style>` block in the Shadow DOM.

## JavaScript / Events

### ✅ Custom events with `composed: true` cross the boundary
```javascript
this.dispatchEvent(new CustomEvent('change', {
  detail: { value: 42 },
  bubbles: true,
  composed: true   // ← Critical: crosses Shadow DOM
}));
```
Without `composed: true`, OutSystems Client Actions can't catch the event.

### ⚠️ `event.target` is retargeted
If you click inside Shadow DOM and the event bubbles out, `event.target` becomes the host element, not the inner element. Use `event.composedPath()` to get the real path.

### ⚠️ `document.querySelector` doesn't find Shadow DOM nodes
```javascript
document.querySelector('button')  // ❌ doesn't find buttons inside Web Components
```
From OutSystems Client Actions, query the host first, then drill in:
```javascript
const widget = $parameters.WidgetRoot.querySelector('acme-toggle');
widget.shadowRoot.querySelector('button');  // ✅ if mode is 'open'
// But better: use the component's public API
widget.checked = true;
```

## OutSystems-specific

### ⚠️ Service Studio Preview doesn't run Custom Elements registration
Web Components only initialize at runtime. Service Studio Preview won't render them. **Always validate in a real browser.**

### ⚠️ Multiple script loads = registration error
OutSystems may load your script multiple times (different pages, hot reload). Custom Elements throw if you `define()` the same tag twice. Always guard:
```javascript
if (!customElements.get('acme-toggle')) {
  customElements.define('acme-toggle', AcmeToggle);
}
```

### ⚠️ Server-side render = empty Web Components
OutSystems Reactive Web doesn't SSR Web Components. The initial HTML will contain `<acme-toggle></acme-toggle>` with no rendered content until the JS executes client-side. If the user sees a flash of empty content, add CSS like:
```css
acme-toggle:not(:defined) {
  display: inline-block;
  width: 60px; height: 24px;
  background: var(--color-neutral-2);
  border-radius: 999px;
}
```
This styles the element while it's still undefined.

### ⚠️ OutSystems Animate pattern can't animate Shadow DOM content
The OutSystems UI Animate pattern uses CSS animations that target child elements. It can't reach inside your Web Component. If you need entrance animations, do them inside the component's `connectedCallback`.

### ⚠️ Accessibility tools see across Shadow DOM, but careful
Screen readers do read Shadow DOM content. But:
- `aria-label` on the host doesn't override inner accessibility tree
- Use proper semantic HTML inside the Shadow DOM (`<button>`, not `<div role="button">`)
- Test with axe DevTools or VoiceOver/NVDA

## Attribute vs Property vs Slot — when to use which

| Pass to Web Component as | When |
|---|---|
| **Attribute** (`<el value="abc">`) | Simple primitives (string, boolean), needs to be in HTML serialization, reactive to CSS attribute selectors |
| **Property** (via JS `el.data = [...]`) | Complex data (objects, arrays), large strings, frequent updates |
| **Slot** (`<el><span slot="x">...</span></el>`) | Arbitrary content/markup — including other OutSystems widgets |

### OutSystems Block wiring per type

**Attribute (declarative in Block markup):**
```html
<acme-toggle checked="{$parameters.IsChecked}" label="{$parameters.Label}">
</acme-toggle>
```

**Property (imperative in OnReady):**
```javascript
const el = $parameters.WidgetRoot.querySelector('acme-pricing-tiers');
el.tiers = $parameters.TiersData;
```

**Slot (use Block Placeholders):**
- Placeholder named `HeaderContent` → renders content with `slot="header"` automatically when wired correctly

## Debugging tips

1. **Open mode shadow root is your friend.** Use `mode: 'open'` so you can inspect via `el.shadowRoot` in DevTools.
2. **Chrome DevTools "Show user agent shadow DOM"** in settings — also reveals your Shadow DOMs.
3. **`customElements.whenDefined('acme-toggle').then(...)`** — waits until your component is registered before code runs (useful for race conditions).
4. **`element.constructor.observedAttributes`** — verify the component knows about the attributes you're setting.
5. **`composedPath()` in event listeners** — see the full event path including Shadow DOM nodes.
