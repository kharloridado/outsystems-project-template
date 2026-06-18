# OutSystems Block Wrapper Pattern (Deep Guide)

The Block wrapper is what turns a Web Component into something usable by every developer in your factory — without them needing to know Web Components exist.

## Why the Block wrapper matters

Without the wrapper, every developer using your component has to:
1. Reference the script
2. Know the tag name
3. Know the attribute API
4. Manually wire events in JavaScript nodes
5. Manually pass complex data via property setters

With the Block wrapper:
1. They drag the Block from the Toolbox
2. They bind inputs declaratively
3. They handle events with Client Actions like any other Block

It's a one-time cost to you, infinite leverage for your team.

## Anatomy of a Block wrapper

### Inputs (Parameters)

Map every meaningful attribute/property of the Web Component to a Block Input Parameter.

| Web Component API | Block Input Type | Notes |
|---|---|---|
| `<el value="...">` (string attr) | Text | Direct binding |
| `<el count="42">` (numeric attr) | Integer/Decimal | Direct binding |
| `<el active>` (boolean attr) | Boolean | Use conditional in markup: `{% if $parameters.Active %}active{% endif %}` |
| `<el size="lg">` (enum attr) | Text or Static Entity | Static Entity gives type safety |
| `el.data = [...]` (property) | List or Structure | Set in OnReady via JS |

### Events (Output Block Events)

One Block Event per meaningful Web Component event. Pass relevant payload data.

```
Block Events:
  - OnChange (Value: Text)
  - OnSelectionChange (SelectedItem: ProductTier, SelectedIndex: Integer)
  - OnSubmit
```

### Placeholders (for slot-based components)

If the Web Component uses slots, expose them as Block Placeholders:

| Web Component Slot | Block Placeholder Name |
|---|---|
| `<slot></slot>` (default) | `Content` or `BodyContent` |
| `<slot name="header"></slot>` | `HeaderContent` |
| `<slot name="footer"></slot>` | `FooterContent` |

Developers using the Block can drop OutSystems widgets, text, or other Blocks into these placeholders — they automatically project into the right slot.

### Style Classes input (standard pattern)

Always include a `ExtendedClass` (or similar) input so devs can pass utility/styling classes:

```html
<acme-panel class="{$parameters.ExtendedClass}">
  ...
</acme-panel>
```

## Complete Block wrapper template

Here's a complete example wrapping the `acme-pricing-toggle` Web Component:

### Block: PricingToggle

**Module location:** Patterns Library (ODC) / Patterns module (O11)

**Input Parameters:**
| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| BillingPeriod | Text | Yes | "monthly" | Current selection: "monthly" or "annual" |
| Disabled | Boolean | No | False | Disables interaction |
| MonthlyLabel | Text | No | "Monthly" | Custom label for monthly option |
| AnnualLabel | Text | No | "Annual (Save 20%)" | Custom label for annual option |
| ExtendedClass | Text | No | "" | Additional CSS classes |

**Block Events:**
| Name | Parameters |
|---|---|
| OnPeriodChange | NewPeriod (Text) |

**Block Placeholders:** (none for this example — it's self-contained)

**Block Content (markup):**

```
[HTML Element: div]
  Properties:
    Tag: acme-pricing-toggle
    Style Classes: "{$parameters.ExtendedClass}"

  [Custom Attributes]
    billing-period = $parameters.BillingPeriod
    disabled       = $parameters.Disabled (conditional)
    monthly-label  = $parameters.MonthlyLabel
    annual-label   = $parameters.AnnualLabel
```

In Service Studio, this is configured via the HTML Element widget's Tag property + Custom Attributes.

**OnReady Client Action:**

```javascript
// JavaScript node in OnReady
var widgetRoot = $parameters.WidgetRoot;
var component = widgetRoot.querySelector('acme-pricing-toggle');

if (component) {
  // Store reference for cleanup
  $public.component = component;

  // Attach event listener
  $public.handlePeriodChange = function(e) {
    $actions.OnPeriodChange(e.detail.value);
  };

  component.addEventListener('change', $public.handlePeriodChange);
}
```

**OnDestroy Client Action:**

```javascript
if ($public.component && $public.handlePeriodChange) {
  $public.component.removeEventListener('change', $public.handlePeriodChange);
}
```

## Usage in feature apps

Once published, any developer can do this:

1. Drag the `PricingToggle` Block from the Toolbox
2. In Properties:
   - Bind `BillingPeriod` to a local Text variable `BillingPeriod`
   - Bind `MonthlyLabel` to a text expression or leave default
3. In Events:
   - Wire `OnPeriodChange` → Client Action that assigns `BillingPeriod` to `NewPeriod`
4. Done.

No JavaScript knowledge required. No Web Component awareness needed. Standard OutSystems experience.

## Block wrapper for slotted components

For components like the `acme-panel` with header/body/footer slots:

**Block Placeholders:**
| Name | Notes |
|---|---|
| HeaderContent | Maps to slot="header" |
| BodyContent | Maps to default slot |
| FooterContent | Maps to slot="footer" |

**Markup:**
```
[HTML Element: acme-panel]
  Attributes: variant="{$parameters.Variant}"

  [HTML Element: span]
    Custom Attribute: slot="header"
    [Placeholder: HeaderContent]

  [Placeholder: BodyContent]

  [HTML Element: span]
    Custom Attribute: slot="footer"
    [Placeholder: FooterContent]
```

Now developers can drag anything they want into HeaderContent/BodyContent/FooterContent — text, other Blocks, OutSystems UI patterns — and it slots into the right place automatically.

## Property-based data binding (complex data)

For components that need lists/objects (Pattern 4 in web-component-patterns.md):

**Block Input:** `Tiers` of type `PricingTier List` (a Structure list)

**OnReady:**
```javascript
var component = $parameters.WidgetRoot.querySelector('acme-pricing-tiers');

// Convert OutSystems List to plain JS array
var data = $parameters.Tiers.map(function(t) {
  return {
    name: t.Name,
    price: t.Price,
    featured: t.IsFeatured,
    features: t.Features  // nested list
  };
});

component.tiers = data;
```

## Reactivity (OutSystems variable changes → Web Component updates)

When an OutSystems variable bound to a Block input changes, OutSystems re-renders the Block. The HTML Element widget's attributes re-render automatically. But for property-based data, you need OnRender:

```javascript
// In OnRender (fires whenever inputs change)
var component = $parameters.WidgetRoot.querySelector('acme-pricing-tiers');
if (component) {
  component.tiers = $parameters.Tiers.map(function(t) { /* ... */ });
}
```

## Script loading strategy

### Option A: Global (preferred for components used widely)
Reference the script in your base Layout's `RequireScript`. Loads once, available everywhere.

### Option B: Per-Block (for rarely used components)
Reference the script in the Block's RequireScript. Only loads when the Block is on a screen.

### Option C: Lazy load via dynamic import
For very large components:
```javascript
// In OnReady
if (!customElements.get('acme-heavy-component')) {
  await import('/scripts/acme-heavy-component.js');
}
```

## Versioning

In ODC: publish your Patterns Library with semver bumps when you change the component's API.
- Adding optional input → Minor
- Adding new event → Minor
- Changing required input type → Major
- Renaming attribute → Major (breaking change)

The wrapped Block API is the contract — keep it stable.
