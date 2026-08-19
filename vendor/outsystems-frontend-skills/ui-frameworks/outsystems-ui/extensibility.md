---
name: osui-extensibility
description: How to extend OutSystems UI patterns beyond their built-in input parameters — typed Set*Configs / Set*Event Client Actions for provider-based patterns (Carousel/DatePicker/DropdownSearch/RangeSlider), the direct JavaScript API (OutSystems.OSUI.Patterns.<X>API), and the custom-block-wrapper pattern for persistent state. Use when a pattern needs behavior its inputs don't expose, when wiring provider-specific options or custom events, or when building a reusable wrapper block that adds features to a standard pattern.
---

# OutSystems UI Pattern Extensibility

> Patterns ship with input parameters and events for the common cases. **Extensibility** is how you go beyond — adding provider-specific options, custom event handlers, custom JavaScript behavior, and CSS — without forking the pattern.

This doc covers the four levels of extensibility, from cheapest to most invasive:

1. **`ExtendedClass`** — scoped custom CSS.
2. **`Set<Provider>Configs` / `Set<Provider>Event` Client Actions** — typed, supported, modern.
3. **Direct JavaScript API** (`OutSystems.OSUI.Patterns.<X>API`) — escape hatch for what the Client Actions don't expose.
4. **Custom block wrapper** — your own Block that wraps a standard pattern and adds persistent state + lifecycle.

Each level has a clear "use when" criterion. Start at level 1 and only escalate when the level below doesn't cover what you need.

## When extensibility is the right answer

| You want to… | Reach for |
|---|---|
| Tweak a pattern's visual style on one screen | `ExtendedClass` argument + scoped CSS class |
| Configure a provider option not exposed as a block input (e.g. Carousel `perMove`, Flatpickr `enableTime` quirks) | `Set<Provider>Configs` Client Action |
| React to a provider-native event the pattern doesn't expose (e.g. Splide `mounted`, Flatpickr `onClose`) | `Set<Provider>Event` Client Action |
| Add behavior the pattern doesn't have at all (Apply/Reset footer, persistent state, custom UI alongside the pattern) | Custom block wrapper (level 4) — see "Wrapper recipe" below |
| Read or call a method on the pattern's underlying instance from a one-off JS node | Direct JS API |

**Stay away from extensibility when:**

- A different pattern would do the job better — don't bend a `Carousel` into a `Tabs` via JS.
- The change you want is screen-specific styling — that's `ExtendedClass` + Theme CSS, not extensibility.
- You're tempted to fork the pattern source. **Don't.** Wrap it instead.

## Level 1 — `ExtendedClass`

Every OutSystems UI pattern has an `ExtendedClass` argument that adds CSS classes to the pattern's root element. Combined with CSS rules in the Application Theme (or a Block stylesheet), this is the cheapest way to customize visuals.

```jsonc
{ "type_": "IMobileBlockInstanceWidget", "SourceBlock": "Card",
  "Arguments": [
    { "type_": "IArgument", "Parameter": "Card.ExtendedClass",
      "Value": "\"my-promo-card shadow-l\"" }
  ],
  "PlaceholdersContent": [/* … */]
}
```

```css
/* In Application Theme stylesheet */
.my-promo-card {
  background: linear-gradient(135deg, var(--color-primary), var(--color-info));
}
```

See [`../../common/css-customization.md`](../../common/css-customization.md) for the broader CSS rules. ExtendedClass doesn't change *behavior* — only appearance.

## Level 2 — `Set<Provider>Configs` and `Set<Provider>Event` Client Actions

Several OutSystems UI patterns are thin wrappers around third-party JavaScript libraries ("providers"). The wrapper exposes the most-used options as block inputs, but the underlying provider has dozens more. The framework exposes those via **typed Client Actions** — no string-JSON, no manual escaping.

### Provider patterns

| Pattern | Provider library |
|---|---|
| `Carousel` | [Splide](https://splidejs.com/) |
| `DatePicker`, `DatePickerRange`, `MonthPicker`, `TimePicker` | [Flatpickr](https://flatpickr.js.org/) |
| `DropdownSearch`, `DropdownTags` | [VirtualSelect](https://sa-si-dev.github.io/virtual-select/) |
| `RangeSlider`, `RangeSliderInterval` | [noUiSlider](https://refreshless.com/nouislider/) |

### Client Action naming convention

For each provider pattern, OutSystems UI exposes:

| Client Action | Purpose |
|---|---|
| `Set<ProviderName>Configs(<PatternId>, <ConfigsRecord>)` | Override provider-specific options. The Configs record's structure mirrors the provider's own option object. |
| `Set<ProviderName>Event(<PatternId>, <EventName>, <Callback>)` | Wire a callback to a provider-native event the pattern doesn't expose. |
| `Unset<ProviderName>Event(<PatternId>, <EventName>)` | Tear down the event handler (use in `OnDestroy`). |

`<ProviderName>` is the library name — e.g. `SetSplideConfigs`, `SetFlatpickrConfigs`, `SetVirtualSelectConfigs`, `SetNoUiSliderConfigs`.

### When to call

The pattern's underlying provider must be initialized before you configure it. Call from the pattern's **`Initialized`** event handler:

```
Pattern (Carousel)
  Event: Initialized → SetMyCarouselConfigs ScreenAction

ScreenAction: SetMyCarouselConfigs
  StartNode
    → ExecuteClientActionNode SetSplideConfigs(
        CarouselId  = <PatternId payload>,
        Configs     = { perMove: 3, gap: "1rem" }
      )
    → EndNode
```

(The `Initialized` event payload typically contains the pattern's runtime ID — pass that as the first argument.)

### Carousel example (from the article)

Set Splide's `perMove` (advance by N slides per click instead of 1) and wire a custom `click` event:

```
ScreenAction: CarouselOnInitialized
  Inputs: PatternId (Text)

  StartNode
    → ExecuteClientActionNode SetSplideConfigs(
        CarouselId = PatternId,
        Configs    = { perMove: 3 }
      )
    → ExecuteClientActionNode SetSplideEvent(
        CarouselId = PatternId,
        EventName  = "click",
        Callback   = OnSlideClickedHandler                  ← reference to a Client Action
      )
    → EndNode

ScreenAction: OnSlideClickedHandler(EventData Object)
  ↳ inside, JavaScript node extracts the slide index from EventData
```

The JavaScript node inside `OnSlideClickedHandler` reads the provider event payload — for Splide:

```javascript
// Inputs: EventData (Object), Outputs: SlideIndex (Integer)
$parameters.SlideIndex = $parameters.EventData.index;
```

### Anti-patterns at level 2

- **Calling `Set<Provider>Configs` before the pattern's `Initialized` event.** The provider isn't ready; the call is silently dropped.
- **Forgetting `Unset<Provider>Event` in `OnDestroy`.** Lingering handlers can leak memory or fire on unmounted instances.
- **Reaching for the legacy `AdvancedFormat` string-JSON parameter.** It's deprecated. The Configs Client Actions replace it with type-safe records.
- **Passing the wrong PatternId.** Each pattern instance has its own ID; if a screen has two Carousels, they're configured independently.

## Level 3 — Direct JavaScript API (`OutSystems.OSUI.Patterns.<X>API`)

When the Client Actions don't expose what you need (a method, a less-common provider option, a custom flow that requires reading runtime state), drop into JavaScript and call the public OutSystems UI API directly.

### Namespace

```
OutSystems.OSUI.Patterns.<PatternName>API
```

Each pattern's API namespace exposes:

- `Initialize(patternId)` — internally called by the framework; rarely useful from app code.
- `SetProviderConfigs(patternId, configs)` — same shape as `Set<Provider>Configs` but called from JS.
- `SetProviderEvent(patternId, eventName, callback)` — same shape as `Set<Provider>Event`.
- `UnsetProviderEvent(patternId, eventName)`.
- Pattern-specific helpers (e.g. `Tabs.SetActiveTab`, `Carousel.GoTo`).

The full reference is the auto-generated TypeDoc at [outsystems-ui-docs.github.io](https://outsystems-ui-docs.github.io/) — browse the `OutSystems.OSUI.Patterns.<X>API` modules for every method.

### Calling from a JavaScript node

Inside a screen's Client Action, drag a JavaScript node and call the API:

```javascript
// Inputs: PatternId (Text)
OutSystems.OSUI.Patterns.CarouselAPI.SetProviderConfigs(
  $parameters.PatternId,
  { perMove: 3, gap: "1rem", autoplay: true }
);
```

Or read state:

```javascript
// Inputs: TabsPatternId (Text), Outputs: ActiveIndex (Integer)
const tabs = OutSystems.OSUI.Patterns.TabsAPI.GetTabsItemById(
  $parameters.TabsPatternId
);
$parameters.ActiveIndex = tabs.activeTabContentElement.dataset.tab;
```

### When to use level 3 over level 2

- The Client Action wrapper for the option you need doesn't exist (rare, but happens for less-common provider options).
- You're inside a JavaScript node already and don't want to round-trip through a ScreenAction.
- You need to call multiple methods in sequence and the imperative shape is clearer.

For the common cases (set provider configs, wire an event), prefer level 2 — it's typed and less brittle.

### Anti-patterns at level 3

- **Calling the API on every screen render.** Call once on `Initialized`. Repeated configuration causes flicker and can leak listeners.
- **Querying the DOM by class name to find a pattern instance.** Use the API's `GetPatternById`-style helpers instead — class names can change between framework versions.
- **Mutating internal state through DOM manipulation** (e.g. `document.querySelector('.my-tabs').classList.add(...)`). Use the API's setters.
- **Catching JS errors silently.** Wrap calls in try/catch and surface failures via `Notification` or feedback messages — silent failures make debugging hard.

## Level 4 — Custom block wrapper (the wrapper recipe)

When you need to add **persistent state, custom UI alongside the pattern, and lifecycle management**, wrap the standard pattern in your own Block. This is the pattern from "OutSystems UI Extensibility — Part II".

### When to use it

- The customization is non-trivial (multiple events, custom UI elements added next to the pattern, persistent state across pattern interactions).
- The customization is **reused** — across multiple screens or as part of an app-wide design system (e.g. "every DatePicker in our app has a Reset button").
- You want to keep app code clean: consumers see a simple `MyCompanyDatePicker` Block, not a screen with a tangle of ScreenActions and JavaScript nodes.

### The pattern

1. **A wrapping Block** — e.g. `MyCompanyDatePicker` — with input parameters that mirror what consumers need plus any extras (`ShowResetButton`, `OnDateChangedHandler`).
2. **A custom JavaScript class** (defined in a JS resource file or inline `RequiredScript`) that encapsulates the extended behavior.
3. **A LocalVariable in the Block** of type `Object` (or a Structure with an Object field) holding the JS class instance.
4. **Lifecycle wiring:**
   - On the wrapped pattern's `Initialized` event → instantiate the JS class, store the reference in the LocalVariable, call any setup methods.
   - On the Block's `OnDestroy` event → call the class's `dispose()` method to detach listeners and free state.
5. **Scoped CSS** via the Block's stylesheet, scoped to a class added through `ExtendedClass` on the wrapped pattern.

### Skeleton

```
Block: MyCompanyDatePicker
  InputParameters:
    DatePickerId      Text                       (passed by consumer or auto-generated)
    InitialDate       Date
    ShowResetButton   Boolean
  OutputParameters:
    SelectedDate      Date
  Events:
    OnDateChanged     (handler reference)
  LocalVariables:
    PickerInstance    Object                     ← holds the custom JS class instance

  Widgets:
    Container.my-company-picker
      DatePicker (PatternId = DatePickerId, ExtendedClass = "my-company-picker")
        Event: Initialized →
          ScreenAction: OnPickerInitialized
            JS node: PickerInstance = new MyCompanyDatePicker(
                       $parameters.DatePickerId,
                       $actions.OnDateChangedHandler
                     );
            // class internally calls SetFlatpickrConfigs, wires events, adds footer DOM
      ↓
      [Apply / Reset / Clear footer rendered by the JS class]

  OnDestroy event handler:
    JS node: $variables.PickerInstance.dispose();
```

### The custom JavaScript class

A simplified shape of `MyCompanyDatePicker`:

```javascript
class MyCompanyDatePicker {
  constructor(datePickerId, onDateChangedHandler) {
    this.datePickerId = datePickerId;
    this.onDateChanged = onDateChangedHandler;

    // 1. Configure the underlying provider (Flatpickr) via the public API.
    OutSystems.OSUI.Patterns.DatePickerAPI.SetProviderConfigs(
      datePickerId,
      {
        closeOnSelect: false,         // keep the picker open for Apply/Reset workflow
        // other Flatpickr options …
      }
    );

    // 2. Add custom DOM (footer with Apply/Reset buttons) next to the pattern.
    this._renderFooter();

    // 3. Wire any provider-native events the pattern doesn't expose.
    OutSystems.OSUI.Patterns.DatePickerAPI.SetProviderEvent(
      datePickerId,
      "onClose",
      (selectedDates) => this._onProviderClose(selectedDates)
    );
  }

  _renderFooter() { /* … inject Apply / Reset buttons … */ }

  _onProviderClose(selectedDates) {
    // Read the picker state, call the consumer's handler.
    const date = selectedDates[0];
    this.onDateChanged(date);
  }

  dispose() {
    // Tear down DOM additions and detach listeners.
    OutSystems.OSUI.Patterns.DatePickerAPI.UnsetProviderEvent(
      this.datePickerId,
      "onClose"
    );
    /* remove footer DOM, clear references */
  }
}
```

### Lifecycle rules

- **Always create the instance in `Initialized`.** The provider isn't mounted before that.
- **Always call `dispose()` in `OnDestroy`.** Without it, listeners leak across navigations and DOM nodes you injected stick around.
- **Store the instance in a Block-scoped LocalVariable**, not a global. Two instances of the wrapper Block on the same screen must each hold their own state.

### Scoped CSS

Pass a class via the wrapped pattern's `ExtendedClass`, then scope all custom rules under that class so other instances of the underlying pattern aren't affected:

```css
.my-company-picker .flatpickr-calendar {
  /* style only flatpickr instances inside this wrapper */
}
.my-company-picker__footer {
  /* style only the custom footer this wrapper injects */
}
```

Do NOT use bare `.flatpickr-calendar { … }` — it will style every DatePicker in the app.

### Anti-patterns at level 4

- **Skipping `dispose()` / `OnDestroy`.** Memory leaks and ghost handlers.
- **Storing the JS class instance globally** instead of in a Block-scoped LocalVariable. Multi-instance support breaks.
- **Forking the wrapped pattern's source.** The whole point of the wrapper is that the underlying pattern stays a stock OutSystems UI pattern — you keep automatic updates, accessibility fixes, and platform support.
- **Using global CSS selectors** in the Block stylesheet. Always scope to the wrapper class.
- **Bypassing the public API and reaching into provider internals directly.** If the API doesn't expose what you need, file feedback rather than monkey-patch.

## Cheat sheet

| Need | Level | Mechanism |
|---|---|---|
| Brand colors / one-off styling | 1 | `ExtendedClass` + Theme CSS |
| Provider option not in pattern inputs | 2 | `Set<Provider>Configs` |
| Provider-native event not exposed | 2 | `Set<Provider>Event` / `Unset<Provider>Event` |
| Imperative one-off — read state, call a method from a JS node | 3 | `OutSystems.OSUI.Patterns.<X>API.<method>` |
| Reusable Block adding behavior + UI on top of a pattern | 4 | Wrapper Block + custom JS class + lifecycle |

## References

- [Official: OutSystems UI Pattern extensibility](https://success.outsystems.com/Documentation/11/Developing_an_Application/Design_UI/Patterns/Using_Mobile_and_Reactive_Patterns/OutSystems_UI_Pattern_extensibility) — high-level overview.
- [Official: Provider instance and JavaScript](https://success.outsystems.com/Documentation/11/Developing_an_Application/Design_UI/Patterns/Using_Mobile_and_Reactive_Patterns/OutSystems_UI_Pattern_extensibility/Provider_instance_and_JavaScript) — accessing the underlying provider.
- [TypeDoc: outsystems-ui-docs.github.io](https://outsystems-ui-docs.github.io/) — auto-generated API reference; browse `OutSystems.OSUI.Patterns.<X>API` modules for every method.
- [OutSystems UI Extensibility — Part I (Bernardo Cardoso, Medium)](https://medium.com/@bernardocardoso/outsystems-ui-extensibility-part-i-f0d5304896ee) — `Set<Provider>Configs` / `Set<Provider>Event` design rationale and Carousel example.
- [OutSystems UI Extensibility — Part II (Bernardo Cardoso, Medium)](https://medium.com/@bernardocardoso/outsystems-ui-extensibility-part-ii-dd35da19de4e) — full custom-block wrapper recipe (`MyCompanyDatePicker`).

## Related

- [`./widget-conventions.md`](./widget-conventions.md) — argument format, FULL PATH naming, event-handler payloads.
- [`./blocks-index.md`](./blocks-index.md) — pattern reference (which patterns are provider-based).
- [`./patterns/interaction.md`](./patterns/interaction.md) — Carousel, DatePicker, DropdownSearch, RangeSlider, etc.
- [`../../common/css-customization.md`](../../common/css-customization.md) — where Block / Theme CSS belongs.
