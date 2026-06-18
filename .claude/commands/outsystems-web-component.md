---
name: outsystems-web-component
description: Generate vanilla JS Web Components for use inside OutSystems Reactive Web and ODC, packaged with an OutSystems Block wrapper for easy integration. Use this skill whenever the user needs a custom UI component that doesn't exist in OutSystems UI, or asks to "build a component from scratch", "create a custom component", "make a Web Component", or when the component-audit skill classifies a design element as "🆕 Build" (Level 5 escalation). Default to Web Components for any L5 custom build — this is the user's chosen architecture.
---

# OutSystems Web Component Generator

Generate vanilla JS Web Components with OutSystems Block wrappers — the user's standard for L5 custom builds.

## When to use

Trigger when:
- User asks for a custom component not in OutSystems UI
- Component audit classifies something as "🆕 Build" (L5)
- User says "build a component", "make a [thing]", "custom [pattern]"
- User explicitly mentions Web Components, Custom Elements, Shadow DOM
- L1–L4 escalation doesn't fit the design

## Why vanilla JS Web Components for OutSystems

The user has chosen this architecture deliberately:
- Single `.js` file → drops into Service Studio as a Script resource
- No build pipeline → no fights with OutSystems deployment
- Shadow DOM encapsulation → CSS won't leak in either direction
- Works identically in O11 Reactive Web and ODC
- Easy to debug (source = production)
- Forge-publishable as a single asset

Don't suggest Lit, Stencil, or other build-based approaches.

## What to generate (always, in this order)

For every Web Component request, produce three deliverables. **Do not generate a standalone test HTML file** — the user validates directly in OutSystems via 1-Click Publish → browser.

### Deliverable 1: The Web Component (.js file)

Vanilla JS using the standard Custom Elements + Shadow DOM API.

**Template structure:**
```javascript
/**
 * <{prefix}-{component-name}>
 *
 * Description: [one-line purpose]
 * Attributes: [list]
 * Properties: [list]
 * Events: [list]
 * Slots: [list]
 *
 * Usage in OutSystems:
 *   <{prefix}-{component-name} attr="value">
 *     <span slot="label">Slot content</span>
 *   </{prefix}-{component-name}>
 */
class {ComponentClass} extends HTMLElement {
  static get observedAttributes() {
    return ['attr-1', 'attr-2'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._state = { /* internal state */ };
  }

  connectedCallback() {
    this.render();
    this._attachEventListeners();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  // Public API methods (callable from OutSystems Client Actions)
  open() { /* ... */ }
  close() { /* ... */ }

  // Property getters/setters
  get value() { return this.getAttribute('value'); }
  set value(v) { this.setAttribute('value', v); }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          /* CSS custom properties exposed for theming from OutSystems */
          --{prefix}-color: var(--color-primary, #1A73E8);
          --{prefix}-padding: var(--space-m, 16px);
          font-family: var(--font-family-body, sans-serif);
        }

        :host([disabled]) {
          opacity: 0.5;
          pointer-events: none;
        }

        .{prefix}-{block} {
          /* BEM-style internal classes — scoped by Shadow DOM */
        }

        .{prefix}-{block}__element { /* ... */ }
        .{prefix}-{block}--is-active { /* ... */ }
      </style>

      <div class="{prefix}-{block}">
        <slot name="header"></slot>
        <div class="{prefix}-{block}__body">
          <slot></slot>
        </div>
        <slot name="footer"></slot>
      </div>
    `;
  }

  _attachEventListeners() {
    // Attach all listeners
  }

  _removeEventListeners() {
    // Clean up on disconnect
  }

  _emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true  // Cross Shadow DOM boundary
    }));
  }
}

// Guard against multiple registrations (important in OutSystems hot-reload scenarios)
if (!customElements.get('{prefix}-{component-name}')) {
  customElements.define('{prefix}-{component-name}', {ComponentClass});
}
```

**Critical rules for the .js file:**
1. Use `customElements.get()` guard before `define()` — OutSystems may load the script multiple times
2. Always use `attachShadow({ mode: 'open' })` so OutSystems can inspect/extend if needed
3. Expose CSS custom properties via `:host` so OutSystems Theme variables can theme it (`--color-primary`, etc.)
4. Use `composed: true` on custom events so they cross Shadow DOM into OutSystems event handlers
5. Always include cleanup in `disconnectedCallback`
6. Use BEM naming inside the Shadow DOM (consistent with the user's external CSS)
7. Document Attributes / Properties / Events / Slots at the top — this is the API contract for OutSystems devs

### Deliverable 2: The OutSystems Block wrapper

A Block that wraps the Web Component for easy use by other OutSystems devs.

**Provide structured instructions like:**

```markdown
## OutSystems Block: {ComponentName}

**Location:** Patterns Library (ODC) or Patterns module (O11)

### Block inputs (Input Parameters)
| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| Value | Text | No | "" | Bound to the `value` attribute |
| Disabled | Boolean | No | False | Bound to the `disabled` attribute |
| ExtendedClass | Text | No | "" | Standard OutSystems pattern — passed through |

### Block Events (Output Parameters as Events)
| Name | Triggered When |
|---|---|
| OnChange | Web Component fires `change` event |
| OnSubmit | Web Component fires `submit` event |

### Block placeholders (use these if the design needs flexible content)
| Name | Slot it maps to |
|---|---|
| HeaderContent | slot="header" |
| BodyContent | (default slot) |
| FooterContent | slot="footer" |

### Block markup (paste into the Block's screen)
\`\`\`html
<{prefix}-{component-name}
    value="{$parameters.Value}"
    {%- if $parameters.Disabled %} disabled{% endif -%}
    class="{$parameters.ExtendedClass}">

    <span slot="header">
        <!-- HeaderContent placeholder -->
    </span>

    <!-- BodyContent placeholder -->

    <span slot="footer">
        <!-- FooterContent placeholder -->
    </span>
</{prefix}-{component-name}>
\`\`\`

### OnReady Client Action (attach event listeners)
\`\`\`javascript
// In Block's OnReady (or OnRender for reactive bindings)
var element = $parameters.WidgetRoot.querySelector('{prefix}-{component-name}');

element.addEventListener('change', function(e) {
    $actions.OnChange(e.detail.value);
});

element.addEventListener('submit', function(e) {
    $actions.OnSubmit();
});
\`\`\`
```

### Deliverable 3: Integration instructions

Step-by-step for the user to install:

```markdown
## Installation in OutSystems

### Step 1: Add the Web Component as a Script Resource
1. Open your Theme module (O11) or Theme Library (ODC) in Service Studio
2. Right-click "Scripts" in the Interface tab → "Import Script"
3. Upload `{prefix}-{component-name}.js`
4. Set "Include in Pages" → "When invoked" (or "Always" if used on many screens)

### Step 2: Reference the script from screens that use it
Either:
- **Globally:** Add to your base Layout's "RequireScript" node
- **Per-screen:** Add a "RequireScript" node in the screen's OnReady action

### Step 3: Create the OutSystems Block wrapper
1. In your Patterns Library / Patterns module, create a new Block called `{ComponentName}`
2. Add the Input Parameters listed above
3. Add the Block Events
4. Add the Placeholders
5. Paste the Block markup into the Block content area
6. Add the OnReady Client Action with the event listener code

### Step 4: Use the Block in feature apps
In any screen, drag the `{ComponentName}` Block from the Toolbox.
Bind inputs to your variables.
Handle Block Events as Client Action callbacks.

### Step 5: Validate in browser
1-Click Publish → F6 to open in browser at all breakpoints. Never trust Service Studio Preview for Web Components — they only initialize at runtime.
```

## CSS theming pattern (critical for OutSystems integration)

The Web Component must expose CSS custom properties via `:host` that OutSystems Theme variables can populate. This is how Shadow DOM components consume external tokens:

```css
:host {
  /* Defaults — fallback chain: OutSystems token → hard-coded fallback */
  --internal-color: var(--color-primary, #1A73E8);
  --internal-bg: var(--color-neutral-0, #FFFFFF);
  --internal-padding: var(--space-m, 16px);
  --internal-radius: var(--border-radius-soft, 4px);
  --internal-font: var(--font-family-body, system-ui);
}

.{prefix}-{block} {
  color: var(--internal-color);
  background: var(--internal-bg);
  padding: var(--internal-padding);
  border-radius: var(--internal-radius);
  font-family: var(--internal-font);
}
```

This way:
- OutSystems Theme `:root` values flow through (Shadow DOM doesn't block CSS custom property inheritance)
- The component has sensible defaults when used outside OutSystems
- Users can override per-instance with `style="--internal-color: red;"` if needed

## Naming conventions

- Web Component tag name: `{prefix}-{component-name}` (e.g., `acme-pricing-toggle`, `corp-data-grid`)
- Class name: PascalCase matching tag (e.g., `AcmePricingToggle`)
- Tag must contain a hyphen (Custom Elements requirement)
- File name: matches tag (e.g., `acme-pricing-toggle.js`)
- OutSystems Block name: PascalCase, no prefix (e.g., `PricingToggle`)

## Always read these references before generating

- `references/web-component-patterns.md` — Reusable patterns (form-associated, list, container, etc.)
- `references/shadow-dom-gotchas.md` — Common pitfalls in OutSystems context
- `references/event-design.md` — How to design events that play well with OutSystems Client Actions
- `references/outsystems-integration.md` — Deep guide to the Block wrapper pattern
