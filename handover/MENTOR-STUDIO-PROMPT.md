# Building handovers in ODC with Mentor Studio

A prompt you paste into **ODC Mentor Studio** (the agentic assistant inside ODC Studio) to
do the OutSystems-side build of a component handover.

## What Mentor Studio does — and doesn't — here

Mentor Studio is a **logic/data agent**: it creates and modifies server actions, client
actions, service actions, aggregates, and screen/Block logic, and it explains/reviews
existing code. Effective-prompt rules from the OutSystems docs:

- **State the goal, give context, then specify details** — in that order.
- **Reference every element by name in every prompt** — Mentor doesn't detect the current
  screen or selection, so "modify the `Toast` Block" beats "modify this Block".
- **Iterate** — start broad, refine in follow-ups; don't over-stuff one prompt.

Mentor does **not** reliably author raw **Theme CSS** or custom **vanilla-JS Web
Components** — and those are exactly our handover artifacts (`dist/theme.css`,
`src/blocks/*.css`, `src/components/*.js`). So we don't ask it to. The dev pastes the CSS
into the Theme editor and imports the `.js` as a Script resource **first** (see each
handover's checklist); Mentor's job is the **Block wrapper, attribute bindings, event
wiring, and the Client Actions** that drive the already-pasted component.

Two OutSystems realities the prompts bake in:

- **Element ids are platform-generated.** You can't hand-type an `id` and address it from
  JS. Give the element/Block a **Name** and pass its runtime `.Id` to the helper
  (`window.<<JS_NAMESPACE>>X.show($parameters.WidgetId)` where `WidgetId = <WidgetName>.Id`). Don't add a
  string `Id` input or bind the `id` attribute.
- **Enumerable inputs are Static Entities.** Model `Type`/`Variant`/`Size`/`Position`/`Status`
  as Static Entities — one record per value, with a single Text attribute (e.g. `Value`) set
  as the record **Identifier** (delete the default Id/Label/Order/Is_Active) holding the
  literal the component expects, not free Text. The input then binds directly (e.g. `type = Type`).

> Sources: OutSystems ODC docs — *Effective prompts for Mentor*, *Prompts for Mentor
> Studio*, *Capabilities and patterns for Mentor Studio*, *Known limitations*.

---

## A) Reusable template (fill the `<<…>>` blanks)

```
Goal: In ODC Studio, wire up an OutSystems Block that wraps the already-imported
custom Web Component <<<<CLASS_PREFIX>>COMPONENT>> for the <<DESIGN_SYSTEM_NAME>> design system.

Context (already done manually — do NOT re-create or edit these):
- The brand Theme CSS (dist/theme.css) and any block CSS are already pasted into the
  ODC Theme editor.
- The Web Component script <<<<CLASS_PREFIX>>COMPONENT.js>> is already imported as a Script
  resource on the Theme/Library, Include = <<Always | When invoked>>. It defines the
  custom element <<<<CLASS_PREFIX>>COMPONENT>> and a global helper <<window.<<JS_NAMESPACE>>COMPONENT>>.
- Do not write CSS, do not author or modify JavaScript, and do not edit the Theme.
  Your job is only the Block, its public interface, the attribute bindings, the event
  wiring, and the Client Action(s) that drive the component.

Task — create these elements, referencing every element by the exact name given:

1. Create a Block named "<<COMPONENT>>" with these input parameters:
   <<Name : DataType : Default — one per line, e.g.
     Type : <<EntityName>> (Static Entity) : <<EntityName>>.<<DefaultRecord>>
     Title : Text : ""
     Message : Text : ""
     Dismissible : Boolean : True
     Duration : Integer : 0 >>
   and these Block events (handlers): <<OnAction, OnDismiss>>.
   Model enumerable inputs (type / variant / size / position / status) as **Static Entities**
   — one record per allowed value, with a **single Text attribute (e.g. `Value`) set as the
   record Identifier** (delete the default Id/Label/Order/Is_Active), holding the literal the
   Web Component expects — NOT free Text. Do **not** add a string `Id` input or set the
   element's `id`: OutSystems generates element ids at runtime (see step 4 for addressing).

2. In the Block, place an HTML element <<<<CLASS_PREFIX>>COMPONENT>>. On it, set one attribute per
   Block input using a Value expression (ODC requires an expression on every attribute):
   <<  type        = Type            // Static-Entity input binds directly (Value is the identifier)
       title       = Title
       message     = Message
       dismissible = If(Dismissible, "true", "false")   // value-aware boolean, not presence
       duration    = Duration  >>
   Static-Entity inputs bind directly (e.g. `type = Type`) since their `Value` attribute is
   the identifier; use the If(flag,"true","false") form for every Boolean. Do not bind `id`.

3. Wire the component's CustomEvents to the Block events:
   <<  "action"  CustomEvent  -> trigger OnAction
       "dismiss" CustomEvent  -> trigger OnDismiss  >>
   Do NOT use the declarative "Handle Events" path (unreliable for custom elements). Instead add
   a "Run JavaScript" node in the Block's **OnReady** that addEventListener's each CustomEvent
   (storing each handler on `$public` so it can be removed) and triggers the matching Block event,
   and a second "Run JavaScript" node in **OnDestroy** that removeEventListener's them. Each
   handover ships the exact OnReady + OnDestroy code in its "## Event wiring (OnReady / OnDestroy)"
   section — paste it verbatim (placement, not authoring).

4. To address a specific instance, give the <<<<CLASS_PREFIX>>COMPONENT>> element (or its Block) a
   **Name**, then create a client action "<<Show COMPONENT>>" with a "Run JavaScript" node
   whose `WidgetId` input is the widget's **platform-generated** `.Id` (e.g. `<<MyWidget>>.Id`)
   — never a hand-typed string:
   <<  window.<<JS_NAMESPACE>>COMPONENT.show($parameters.WidgetId);  >>
   Add sibling client actions for any other helper methods (<<hide, toggle>>) the same way.

Constraints / fidelity rules (must hold):
- Never edit the OutSystems UI module; build only on top.
- Do not hard-code colors/sizes anywhere — all styling already comes from var(--token)
  in the pasted Theme; you are not adding styles.
- Apply variants on native widgets via Extended Class only (e.g. ExtendedClass =
  "btn-ghost"); never mutate OutSystems UI internals. (N/A for pure Web Components.)
- After generating, list exactly which elements you created/modified by name, and list
  any step you could NOT do so I can finish it manually.

Work iteratively: do step 1 first and show me the Block interface before wiring events.
```

**How to drive it:** paste the filled template, let Mentor create the Block interface,
confirm, then continue with steps 2–4. Always name elements explicitly. Treat it as a
conversation, not one shot.

---

## B) Worked example — `<<CLASS_PREFIX>>toast`

Filled from [`handover/<<CLASS_PREFIX>>toast.md`](<<CLASS_PREFIX>>toast.md).

```
Goal: In ODC Studio, wire up an OutSystems Block that wraps the already-imported custom
Web Component <<<CLASS_PREFIX>>toast> for the <<DESIGN_SYSTEM_NAME>> design system (transient toast
notification at a configurable screen position).

Context (already done manually — do NOT re-create or edit these):
- dist/theme.css (brand + component tokens, incl. --<<CLASS_PREFIX>>toast-*) is already pasted into
  the ODC Theme editor.
- <<CLASS_PREFIX>>toast.js is already imported as a Script resource on the Theme/Library, Include =
  Always. It defines the custom element <<<CLASS_PREFIX>>toast> and the global helper window.<<JS_NAMESPACE>>Toast
  with methods show(idOrEl, opts), hide(idOrEl), toggle(idOrEl, force).
- Do NOT write CSS, do NOT author or modify JavaScript, do NOT edit the Theme. Your job is
  only the Block, its inputs/events, the attribute bindings, the event wiring, and the
  Client Actions that drive the toast.

Task — create these elements, referencing each by the exact name given:

1. Create a Block named "Toast" with input parameters:
     Type        : ToastType (Static Entity)     : ToastType.Default
     Position    : ToastPosition (Static Entity) : ToastPosition.Bottom
     Title       : Text                          : ""
     Message     : Text                          : ""
     ButtonLabel : Text                          : ""
     ButtonHref  : Text                          : ""
     Dismissible : Boolean                       : True
     Duration    : Integer                       : 5000
   and Block events: OnAction, OnDismiss.
   Static Entities — create these first. Give each a single Text attribute "Value" set as the
   record Identifier (delete the default Id/Label/Order/Is_Active); each record's value is the
   literal the Web Component expects, so model Type/Position as the entity, NOT free Text:
   - ToastType: Default="default", Success="success", Warning="warning", Error="error", Information="information"
   - ToastPosition: Bottom="bottom", Top="top", BottomLeft="bottom-left", BottomRight="bottom-right", TopLeft="top-left", TopRight="top-right"
   Do NOT add a string Id input or set the element's id — OutSystems generates ids at runtime.

2. In the Block, place an HTML element <<<CLASS_PREFIX>>toast>. Set one attribute per input via a
   Value expression:
     type         = Type
     position     = Position
     title        = Title
     message      = Message
     button-label = ButtonLabel
     button-href  = ButtonHref
     dismissible  = If(Dismissible, "true", "false")
     duration     = Duration
   Static-Entity inputs bind directly (type = Type, position = Position) — the Value attribute
   is the identifier. Use the If(flag,"true","false") form for the Boolean (values, not presence).

3. Wire CustomEvents to Block events: the element's "action" CustomEvent triggers OnAction,
   and its "dismiss" CustomEvent triggers OnDismiss. Do this in the Block's **OnReady** (a
   "Run JavaScript" node that addEventListener's both events on the <<<CLASS_PREFIX>>toast> element,
   storing each handler on `$public`, and raises the Block events) and clean up in **OnDestroy**
   (a second "Run JavaScript" node that removeEventListener's them) — not via the declarative
   "Handle Events" path. Paste the verbatim code from the handover's "## Event wiring
   (OnReady / OnDestroy)" section.

4. OutSystems generates element ids at runtime, so address a specific toast by its widget's
   platform .Id — not a hand-typed string. Give the <<<CLASS_PREFIX>>toast> element (or its Block) a
   Name, then create client actions whose "Run JavaScript" node takes a WidgetId input set to
   <thatWidgetName>.Id and calls the helper:
     - "ShowToast":   window.<<JS_NAMESPACE>>Toast.show($parameters.WidgetId);
     - "HideToast":   window.<<JS_NAMESPACE>>Toast.hide($parameters.WidgetId);
     - "ToggleToast": window.<<JS_NAMESPACE>>Toast.toggle($parameters.WidgetId);

Constraints:
- Never edit the OutSystems UI module; no hard-coded colors/sizes (styling already comes
  from var(--token) in the Theme); you add no CSS.
- After generating, list every element you created by name, and flag any step you could
  not complete so I can finish it manually.

Start by creating the Block "Toast" with the inputs and events in step 1, then show me the
interface before we wire the bindings and events.
```

After Mentor finishes: **1-Click Publish and validate in a real browser** at phone/tablet/
desktop (Service Studio Preview does not run Web Components) — test all five `type`s, both
layouts, and all positions, per the handover checklist.
