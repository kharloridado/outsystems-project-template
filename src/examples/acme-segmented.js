/**
 * <acme-segmented>  —  Segmented control (single-select toggle group)
 *
 * An L5 custom Web Component: no OutSystems UI pattern matches a true
 * roving-tabindex segmented control, so it is built from scratch.
 *
 * Attributes:
 *   value     (Text)    currently selected option value
 *   options   (Text)    JSON array of {value,label}, e.g. '[{"value":"d","label":"Day"}]'
 *   size      (Text)    "" | "large"   (maps to the design's Size input parameter)
 *   disabled  (Boolean) presence disables the whole control
 * Properties: value (get/set), options (get/set)
 * Events:
 *   change  -> detail: { value }   fired on user selection (composed, bubbles)
 * Slots: none (options are data-driven)
 *
 * Usage in OutSystems:
 *   <acme-segmented value="day" options='[{"value":"day","label":"Day"},{"value":"week","label":"Week"}]'></acme-segmented>
 *
 * Accessibility: WCAG 2.2 AA. role=radiogroup / role=radio, roving tabindex,
 *   Arrow/Home/End keyboard nav, focus ring in the design's own brand color.
 */
class RntSegmented extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'options', 'size', 'disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._onKeydown = this._onKeydown.bind(this);
    this._onClick = this._onClick.bind(this);
  }

  connectedCallback() {
    this.render();
    this._attachEventListeners();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.render();
  }

  /* ---- Public API (callable from OutSystems Client Actions) ---- */
  get value() { return this.getAttribute('value') || ''; }
  set value(v) { this.setAttribute('value', v); }

  get options() {
    try { return JSON.parse(this.getAttribute('options') || '[]'); }
    catch { return []; }
  }
  set options(arr) { this.setAttribute('options', JSON.stringify(arr || [])); }

  /* ---- Internal ---- */
  _select(value, { emit = true } = {}) {
    if (this.hasAttribute('disabled') || value === this.value) return;
    this.value = value; // triggers re-render via attributeChangedCallback
    if (emit) this._emit('change', { value });
  }

  _onClick(e) {
    const btn = e.target.closest('[role="radio"]');
    if (btn) this._select(btn.dataset.value);
  }

  _onKeydown(e) {
    const opts = this.options;
    if (!opts.length) return;
    let idx = opts.findIndex(o => o.value === this.value);
    if (idx < 0) idx = 0;

    let next = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = (idx + 1) % opts.length; break;
      case 'ArrowLeft':
      case 'ArrowUp':   next = (idx - 1 + opts.length) % opts.length; break;
      case 'Home':      next = 0; break;
      case 'End':       next = opts.length - 1; break;
      default: return;
    }
    e.preventDefault();
    this._select(opts[next].value);
    const el = this.shadowRoot.querySelector(`[data-value="${opts[next].value}"]`);
    if (el) el.focus();
  }

  _attachEventListeners() {
    this.shadowRoot.addEventListener('click', this._onClick);
    this.shadowRoot.addEventListener('keydown', this._onKeydown);
  }

  _removeEventListeners() {
    this.shadowRoot.removeEventListener('click', this._onClick);
    this.shadowRoot.removeEventListener('keydown', this._onKeydown);
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  render() {
    const opts = this.options;
    const current = this.value;
    const disabled = this.hasAttribute('disabled');

    // Styles are the same source kept in acme-segmented.css (embedded here so the
    // component ships as a single drop-in .js with no build step).
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          /* Fallback chain: OutSystems Theme token -> sensible default */
          --acme-seg-bg:        var(--color-neutral-1, #F1F5F9);
          --acme-seg-fg:        var(--color-neutral-9, #1E293B);
          --acme-seg-sel-bg:    var(--color-neutral-0, #FFFFFF);
          --acme-seg-accent:    var(--color-primary, #1A73E8);
          --acme-seg-radius:    var(--border-radius-soft, 6px);
          --acme-seg-pad-y:     var(--space-xs, 4px);
          --acme-seg-pad-x:     var(--space-m, 16px);
          --acme-seg-font:      var(--font-family-base, system-ui, sans-serif);
        }
        :host([disabled]) { opacity: 0.5; pointer-events: none; }

        .acme-segmented {
          display: inline-flex;
          gap: var(--space-xs, 4px);
          padding: var(--space-xs, 4px);
          background: var(--acme-seg-bg);
          border-radius: var(--acme-seg-radius);
          font-family: var(--acme-seg-font);
        }

        .acme-segmented__option {
          min-height: 44px;               /* WCAG 2.2 target size */
          padding: var(--acme-seg-pad-y) var(--acme-seg-pad-x);
          border: none;
          border-radius: calc(var(--acme-seg-radius) - 2px);
          background: transparent;
          color: var(--acme-seg-fg);
          font: inherit;
          cursor: pointer;
          transition: background-color 120ms ease;
        }
        .acme-segmented__option--is-selected {
          background: var(--acme-seg-sel-bg);
          font-weight: var(--font-weight-medium, 600);
          box-shadow: 0 1px 2px rgba(0,0,0,0.12);
        }
        .acme-segmented__option:focus-visible {
          outline: 2px solid var(--acme-seg-accent);   /* design's own color */
          outline-offset: 2px;
        }

        /* size="large" — maps to the design's Size input parameter */
        :host([size="large"]) .acme-segmented__option {
          min-height: 52px;
          padding: var(--space-s, 8px) var(--space-l, 24px);
          font-size: var(--font-size-l, 20px);
        }

        @media (prefers-reduced-motion: reduce) {
          .acme-segmented__option { transition: none; }
        }
      </style>

      <div class="acme-segmented" role="radiogroup" aria-disabled="${disabled}">
        ${opts.map(o => {
          const selected = o.value === current;
          return `<button
            type="button"
            class="acme-segmented__option${selected ? ' acme-segmented__option--is-selected' : ''}"
            role="radio"
            aria-checked="${selected}"
            data-value="${o.value}"
            tabindex="${selected ? '0' : '-1'}"
          >${o.label}</button>`;
        }).join('')}
      </div>
    `;

    // Ensure at least one option is focusable if nothing is selected yet
    if (!opts.some(o => o.value === current)) {
      const first = this.shadowRoot.querySelector('[role="radio"]');
      if (first) first.tabIndex = 0;
    }
  }
}

// Guard against multiple registrations (OutSystems may load the script more than once)
if (!customElements.get('acme-segmented')) {
  customElements.define('acme-segmented', RntSegmented);
}
