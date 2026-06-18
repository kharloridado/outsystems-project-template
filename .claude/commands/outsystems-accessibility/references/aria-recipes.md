# ARIA Recipes for Common Components

Standard ARIA patterns for components commonly built in OutSystems.

## Button (toggle state)

```html
<button type="button" aria-pressed="false">
  <span class="acme-toggle__label">Show details</span>
</button>
```

When pressed: `aria-pressed="true"`.

## Disclosure (show/hide)

```html
<button type="button"
        aria-expanded="false"
        aria-controls="panel-1">
  More options
</button>
<div id="panel-1" hidden>
  ...
</div>
```

Toggle `aria-expanded` and `hidden` attribute together.

## Modal / Dialog

```html
<div role="dialog"
     aria-modal="true"
     aria-labelledby="dialog-title"
     aria-describedby="dialog-desc">
  <h2 id="dialog-title">Confirm action</h2>
  <p id="dialog-desc">Are you sure you want to delete this?</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```

When open: rest of page gets `aria-hidden="true"` and `inert`. Focus moves into dialog.

## Tabs

```html
<div role="tablist" aria-label="Settings sections">
  <button role="tab"
          id="tab-general"
          aria-selected="true"
          aria-controls="panel-general"
          tabindex="0">
    General
  </button>
  <button role="tab"
          id="tab-billing"
          aria-selected="false"
          aria-controls="panel-billing"
          tabindex="-1">
    Billing
  </button>
</div>
<div role="tabpanel"
     id="panel-general"
     aria-labelledby="tab-general"
     tabindex="0">
  ...
</div>
<div role="tabpanel"
     id="panel-billing"
     aria-labelledby="tab-billing"
     tabindex="0"
     hidden>
  ...
</div>
```

Note: only the active tab has `tabindex="0"`; others use `-1` so Tab moves to the panel, not between tabs (arrows handle tab navigation).

## Form input with label and error

```html
<label for="email">Email address</label>
<input id="email"
       type="email"
       autocomplete="email"
       aria-invalid="true"
       aria-describedby="email-error email-hint"
       required>
<span id="email-hint" class="acme-input__hint">We'll never share your email.</span>
<span id="email-error" class="acme-input__error" role="alert">
  Please enter a valid email address (example: name@domain.com)
</span>
```

Notes:
- `aria-invalid` only when there's an error
- `aria-describedby` can reference multiple IDs (space-separated)
- `role="alert"` on error message announces it to screen readers immediately

## Combobox (autocomplete dropdown)

```html
<label for="country">Country</label>
<input id="country"
       type="text"
       role="combobox"
       aria-autocomplete="list"
       aria-expanded="false"
       aria-controls="country-listbox"
       aria-activedescendant="">

<ul id="country-listbox" role="listbox" hidden>
  <li role="option" id="opt-us" aria-selected="false">United States</li>
  <li role="option" id="opt-uk" aria-selected="false">United Kingdom</li>
  ...
</ul>
```

As user types/arrow-navigates: update `aria-activedescendant` to current option ID.

## Notification / Toast

```html
<div role="status" aria-live="polite">
  <!-- Polite: doesn't interrupt -->
  Your changes have been saved.
</div>

<div role="alert" aria-live="assertive">
  <!-- Assertive: interrupts immediately -->
  Failed to save changes. Please try again.
</div>
```

For OutSystems UI Notification pattern, ensure the underlying markup uses these roles.

## Accordion

```html
<h3>
  <button type="button"
          aria-expanded="false"
          aria-controls="section-1">
    Frequently asked questions
  </button>
</h3>
<div id="section-1" role="region" hidden>
  <p>Content...</p>
</div>
```

Use real heading element wrapping the button — preserves document outline.

## Breadcrumbs

```html
<nav aria-label="Breadcrumb">
  <ol class="acme-breadcrumbs">
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Widget</li>
  </ol>
</nav>
```

Current page uses `aria-current="page"` and isn't a link.

## Pagination

```html
<nav aria-label="Pagination">
  <ul class="acme-pagination">
    <li><a href="?page=1" aria-label="Go to page 1">1</a></li>
    <li><a href="?page=2" aria-label="Go to page 2" aria-current="page">2</a></li>
    <li><a href="?page=3" aria-label="Go to page 3">3</a></li>
  </ul>
</nav>
```

## Loading / Spinner

```html
<div role="status" aria-live="polite">
  <span class="acme-spinner" aria-hidden="true"></span>
  <span class="acme-visually-hidden">Loading...</span>
</div>
```

Spinner visual is `aria-hidden`; screen reader text is in a visually-hidden span.

## Slider

Use native `<input type="range">` when possible. For custom:

```html
<div role="slider"
     tabindex="0"
     aria-valuemin="0"
     aria-valuemax="100"
     aria-valuenow="50"
     aria-valuetext="50 dollars"
     aria-label="Price"
     aria-orientation="horizontal">
</div>
```

`aria-valuetext` is for human-friendly values when `aria-valuenow` alone isn't clear.

## Visually hidden helper (always include in Theme)

```css
.acme-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Use for content that screen readers need but visual users don't (e.g., button labels for icon-only buttons, loading announcements).

## Anti-patterns

### ❌ Don't use ARIA when HTML has a native option
```html
<!-- ❌ -->
<div role="button" tabindex="0">Click me</div>

<!-- ✅ -->
<button type="button">Click me</button>
```

### ❌ Don't add ARIA that contradicts state
```html
<!-- ❌ Visually disabled but says enabled to screen reader -->
<button class="acme-btn--is-disabled" aria-disabled="false">Submit</button>
```

### ❌ Don't use `role` instead of fixing semantic HTML
```html
<!-- ❌ -->
<span role="link" onclick="navigate()">More info</span>

<!-- ✅ -->
<a href="/more-info">More info</a>
```

### ❌ Don't make every element focusable
```html
<!-- ❌ Decorative card shouldn't be focusable -->
<div tabindex="0" class="acme-card">Static content</div>

<!-- ✅ Only interactive elements inside it are focusable -->
<div class="acme-card">
  <h3>Title</h3>
  <p>Content</p>
  <a href="/details">Learn more</a>
</div>
```
