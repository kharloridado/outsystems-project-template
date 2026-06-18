# Web Components vs OutSystems-Native Blocks (When to Use Each)

Both are valid for L4-L5 customization. Knowing when to choose which is critical.

## Use OutSystems-native Blocks (L4) when:

- You can leverage an OS UI pattern as the base
- The visual customization is achievable with ExtendedClass + BEM
- You need to compose multiple OS UI patterns together
- The internal logic is data-driven and Aggregates/Data Actions fit naturally
- The component is tightly coupled to OutSystems concepts (entities, structures, user actions)
- Other devs benefit from drag-and-drop OutSystems widgets inside

**Example:** ProductCard that uses OS UI Card + Image + Heading + Button widgets internally, with Block inputs for ProductName, Price, ImageURL.

## Use Web Components (L5) when:

- **No OS UI pattern fits the structure** — you'd be hand-rolling HTML widgets anyway
- The component has complex interactive behavior (animations, gestures, custom keyboard handling)
- You need true encapsulation (Shadow DOM prevents CSS leakage)
- The component might be reused outside OutSystems someday
- You're building a primitive (segmented control, color picker, custom chart) that's purely UI
- You want zero coupling to OutSystems concepts in the component itself

**Example:** PricingToggle (segmented control with animation), DataGrid (virtualized list with custom keyboard nav), custom Chart component.

## Decision flowchart

```
Q: Does an OS UI pattern provide the structure I need?
   YES → L3 (ExtendedClass) or L4 (Wrap in Block)
   NO  → Continue

Q: Is this primarily a UI primitive (no business logic)?
   YES → Web Component (L5)
   NO  → Continue

Q: Does it need OutSystems entities/data sources directly?
   YES → OutSystems Block from scratch (still L5, but Block-native)
   NO  → Web Component (L5)

Q: Does it have complex animations, gestures, or non-trivial DOM manipulation?
   YES → Web Component (L5) — vanilla DOM APIs work better
   NO  → Either works; pick by team preference
```

## Cost comparison

| Aspect | OS-Native Block | Web Component + Block Wrapper |
|---|---|---|
| Initial build time | Lower (drag widgets) | Higher (write Custom Element class) |
| Encapsulation | None (CSS leaks possible) | Full (Shadow DOM) |
| Portability | Locked to OutSystems | Works anywhere |
| Versioning | Block-level | Component-level (clearer contract) |
| Debugging | Service Studio + browser | Browser only (cleaner) |
| Onboarding new devs | Familiar OutSystems workflow | Need Web Component basics |
| Future-proofing | Tied to OutSystems platform | Web standard |

## Hybrid approach: Web Component inside Block (recommended for L5)

The user's chosen architecture combines the best of both:
1. **Web Component** does the actual rendering + behavior (encapsulated, portable)
2. **OutSystems Block wraps it** with familiar inputs, events, placeholders

Result: Other devs get the OutSystems experience they expect. You get encapsulation and portability. The Web Component is the implementation detail.

```
End Developer's POV:
  - Drag PricingToggle Block from Toolbox
  - Bind BillingPeriod input
  - Handle OnPeriodChange event
  - Never knows or cares it's a Web Component underneath

Your POV (component author):
  - Build the Web Component once
  - Wrap in Block once
  - Maintain the Web Component as a clean, isolated module
```

This is why the workflow always generates BOTH the .js file AND the Block wrapper.

## What NOT to do

- ❌ **Don't use Web Components for everything.** L3 and L4 cover most needs.
- ❌ **Don't skip the Block wrapper.** Raw `<acme-thing>` in Expression widgets is hostile to other devs.
- ❌ **Don't use Lit/Stencil/React inside OutSystems.** Build steps fight OutSystems deployment.
- ❌ **Don't put business logic inside the Web Component.** Keep it pure UI; orchestrate from Client Actions.
