# Web Component Patterns for OutSystems

Reusable patterns for common Web Component types. Pick the pattern closest to your need, then adapt.

## Pattern 1: Stateful Toggle (boolean state)

For: switches, segmented controls, on/off toggles.

```javascript
class AcmeToggle extends HTMLElement {
  static get observedAttributes() {
    return ['checked', 'disabled', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this._button = this.shadowRoot.querySelector('button');
    this._button.addEventListener('click', this._handleClick);
  }

  disconnectedCallback() {
    this._button?.removeEventListener('click', this._handleClick);
  }

  attributeChangedCallback() {
    this.render();
  }

  _handleClick = (e) => {
    if (this.disabled) return;
    this.checked = !this.checked;
    this._emit('change', { checked: this.checked });
  };

  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { v ? this.setAttribute('checked', '') : this.removeAttribute('checked'); }
  get disabled() { return this.hasAttribute('disabled'); }
  get label() { return this.getAttribute('label') || ''; }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  render() {
    if (!this.shadowRoot.innerHTML) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: inline-block; }
          :host([disabled]) { opacity: 0.5; pointer-events: none; }
          .acme-toggle {
            display: inline-flex;
            align-items: center;
            gap: var(--space-s, 8px);
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            font: inherit;
          }
          .acme-toggle__track {
            width: 40px; height: 22px;
            background: var(--color-neutral-3, #E2E8F0);
            border-radius: 999px;
            position: relative;
            transition: background 0.2s ease;
          }
          .acme-toggle__thumb {
            position: absolute;
            top: 2px; left: 2px;
            width: 18px; height: 18px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s ease;
          }
          :host([checked]) .acme-toggle__track { background: var(--color-primary, #1A73E8); }
          :host([checked]) .acme-toggle__thumb { transform: translateX(18px); }
          .acme-toggle__label { color: var(--color-neutral-9, #1E293B); }
        </style>
        <button class="acme-toggle" type="button" role="switch" aria-checked="${this.checked}">
          <span class="acme-toggle__track">
            <span class="acme-toggle__thumb"></span>
          </span>
          <span class="acme-toggle__label">${this.label}</span>
        </button>
      `;
    } else {
      // Update only changed parts on subsequent renders
      this._button.setAttribute('aria-checked', this.checked);
      const label = this.shadowRoot.querySelector('.acme-toggle__label');
      if (label) label.textContent = this.label;
    }
  }
}

if (!customElements.get('acme-toggle')) {
  customElements.define('acme-toggle', AcmeToggle);
}
```

## Pattern 2: Container with Slots (composable layout)

For: cards, modals, panels — components that wrap arbitrary content.

```javascript
class AcmePanel extends HTMLElement {
  static get observedAttributes() { return ['variant', 'elevated']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .acme-panel {
          background: var(--color-neutral-0, #FFFFFF);
          border-radius: var(--border-radius-soft, 4px);
          padding: var(--space-m, 16px);
          border: 1px solid var(--color-neutral-3, #E2E8F0);
        }
        :host([elevated]) .acme-panel {
          box-shadow: var(--shadow-m, 0 4px 8px rgba(0,0,0,0.1));
          border: none;
        }
        :host([variant="featured"]) .acme-panel {
          border: 2px solid var(--color-primary, #1A73E8);
        }
        .acme-panel__header { margin-bottom: var(--space-s, 8px); }
        .acme-panel__footer { margin-top: var(--space-m, 16px); padding-top: var(--space-s, 8px); border-top: 1px solid var(--color-neutral-2, #F1F5F9); }
        ::slotted([slot="header"]) {
          font-weight: 600;
          color: var(--color-neutral-9, #1E293B);
        }
      </style>
      <div class="acme-panel">
        <div class="acme-panel__header"><slot name="header"></slot></div>
        <div class="acme-panel__body"><slot></slot></div>
        <div class="acme-panel__footer"><slot name="footer"></slot></div>
      </div>
    `;
  }
}

if (!customElements.get('acme-panel')) {
  customElements.define('acme-panel', AcmePanel);
}
```

**OutSystems Block placeholders map to slots:**
- `HeaderContent` placeholder → `slot="header"`
- `BodyContent` placeholder → default slot (no name attribute)
- `FooterContent` placeholder → `slot="footer"`

## Pattern 3: Form-Associated Custom Element (input replacement)

For: custom inputs that need to participate in OutSystems forms.

```javascript
class AcmePinInput extends HTMLElement {
  static formAssociated = true;
  static get observedAttributes() { return ['length', 'value', 'disabled']; }

  constructor() {
    super();
    this._internals = this.attachInternals();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this._attachListeners();
  }

  _attachListeners() {
    this.shadowRoot.addEventListener('input', this._handleInput);
  }

  _handleInput = (e) => {
    const inputs = [...this.shadowRoot.querySelectorAll('input')];
    const value = inputs.map(i => i.value).join('');
    this._internals.setFormValue(value);  // Participates in forms
    this.setAttribute('value', value);
    this._emit('change', { value });

    // Auto-advance focus
    if (e.target.value && e.target.nextElementSibling) {
      e.target.nextElementSibling.focus();
    }
  };

  get value() { return this.getAttribute('value') || ''; }
  set value(v) { this.setAttribute('value', v); }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  render() {
    const length = parseInt(this.getAttribute('length') || '6', 10);
    const value = this.value.split('');
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; }
        .acme-pin-input { display: flex; gap: var(--space-xs, 4px); }
        .acme-pin-input__digit {
          width: 40px; height: 48px;
          text-align: center;
          font-size: var(--font-size-xl, 20px);
          border: 2px solid var(--color-neutral-3, #E2E8F0);
          border-radius: var(--border-radius-soft, 4px);
        }
        .acme-pin-input__digit:focus {
          outline: none;
          border-color: var(--color-primary, #1A73E8);
        }
      </style>
      <div class="acme-pin-input">
        ${Array.from({ length }, (_, i) => `
          <input type="text" inputmode="numeric" maxlength="1"
                 class="acme-pin-input__digit"
                 value="${value[i] || ''}"
                 ${this.hasAttribute('disabled') ? 'disabled' : ''}>
        `).join('')}
      </div>
    `;
  }
}

if (!customElements.get('acme-pin-input')) {
  customElements.define('acme-pin-input', AcmePinInput);
}
```

**Why this matters for OutSystems:**
- `formAssociated = true` + `_internals.setFormValue()` makes the component work with native `<form>` validation and OutSystems form patterns.
- Standard event names (`change`, `input`) integrate cleanly with OutSystems Client Actions.

## Pattern 4: List/Repeater Component (data-driven)

For: complex repeating displays not covered by OutSystems Table or List.

```javascript
class AcmePricingTiers extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._tiers = [];
  }

  connectedCallback() { this.render(); }

  // Property API for OutSystems to set complex data
  set tiers(data) {
    this._tiers = Array.isArray(data) ? data : [];
    this.render();
  }
  get tiers() { return this._tiers; }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .acme-tiers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-m, 16px);
        }
        .acme-tiers__card {
          padding: var(--space-l, 24px);
          border: 1px solid var(--color-neutral-3, #E2E8F0);
          border-radius: var(--border-radius-rounded, 8px);
        }
        .acme-tiers__card--featured {
          border-color: var(--color-primary, #1A73E8);
          border-width: 2px;
        }
        .acme-tiers__name { font-size: var(--font-size-h4, 20px); margin: 0 0 var(--space-s, 8px); }
        .acme-tiers__price { font-size: var(--font-size-display, 48px); font-weight: 700; }
      </style>
      <div class="acme-tiers">
        ${this._tiers.map(tier => `
          <div class="acme-tiers__card ${tier.featured ? 'acme-tiers__card--featured' : ''}">
            <h3 class="acme-tiers__name">${tier.name}</h3>
            <div class="acme-tiers__price">$${tier.price}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

if (!customElements.get('acme-pricing-tiers')) {
  customElements.define('acme-pricing-tiers', AcmePricingTiers);
}
```

**OutSystems usage:**
```javascript
// In OnReady Client Action
var el = $parameters.WidgetRoot.querySelector('acme-pricing-tiers');
el.tiers = $parameters.TiersData; // OutSystems list/structure data
```

## Pattern selection guide

| You're building | Use pattern |
|---|---|
| On/off switch, segmented control | Pattern 1 (Stateful Toggle) |
| Card, modal, panel, layout wrapper | Pattern 2 (Container with Slots) |
| Custom input/picker that needs form validation | Pattern 3 (Form-Associated) |
| Data-driven repeating display | Pattern 4 (List/Repeater) |
| Something else | Combine patterns or ask for a specific recipe |
