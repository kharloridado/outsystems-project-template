---
name: outsystems-accessibility
description: Validate OutSystems frontend code against WCAG 2.2 Level AA — color contrast, focus management, keyboard navigation, semantic HTML, ARIA, and touch target sizes. Use this skill alongside every CSS, Web Component, or Style Guide generation. It applies implementation-level accessibility automatically (focus rings in the design's own colors, keyboard handlers, ARIA, semantic HTML, reduced-motion, labels) but it NEVER silently alters brand colors or other design-specified values to pass a check — those conflicts are raised as findings via the outsystems-design-findings skill. Fidelity to the design comes first; accessibility conflicts baked into the design are flagged, not fixed.
---

# Accessibility — Validate, Auto-fix Implementation, Flag the Rest (WCAG 2.2 AA)

This skill runs alongside every other skill that generates UI code. It is not a standalone trigger — it's a validator that integrates into CSS generation, Web Component generation, audits, and Style Guide docs.

## Default behavior: fidelity first, flag conflicts

The implementation must match the approved design. Accessibility work splits into two tiers:

**Tier 1 — auto-apply silently (no conflict with the visual design):**
focus indicators using *the design's own colors*, keyboard handlers, semantic HTML, ARIA states, form labels, error identification, reduced-motion guards, and touch-target sizing where the layout has room. These are implementation details that don't change any decision the designer made, so apply them automatically without asking.

**Tier 2 — flag, never fix (would change a design-specified value):**
brand-color contrast failures, off-palette colors, hard-coded values with no token, or a target that can't grow without altering the specified layout. **Do not substitute shades, darken the primary, or "snap" colors.** Build it as designed and raise a finding via `outsystems-design-findings`. The suggested remediation goes *in the finding* (as advice for the designer/brand owner), not into the code.

Why: silently changing a brand color to pass contrast produces an implementation that no longer matches the approved mockup. That breaks brand fidelity and hides a decision that belongs to the designer. Faithful build + tracked finding is the correct outcome.

## The dividing line (quick test)

If the fix would make the built UI look different from the mockup → **flag it** (Tier 2). Otherwise → **apply it** (Tier 1). When unsure, flag.

## Override mechanism

By default we build to spec and flag. The override is the *opposite* direction from before: if the user has brand-owner sign-off to actually apply an accessibility correction that deviates from the design, they say so per-finding:
- "apply the contrast fix on FND-003" / "go ahead and darken that, brand approved it"

When this happens:
1. Apply the corrected value, referencing the finding.
2. Add a `/* a11y-fix per FND-NNN: #1A73E8 → #1B4FB8, brand-approved */` comment.
3. Update the finding's disposition to `fixed-in-design` (or `accepted-as-designed` if the design itself was changed).

Without that explicit sign-off, never deviate from the design — flag instead.

## WCAG 2.2 AA criteria to enforce

These are the criteria most relevant to OutSystems frontend work. Apply them to every generation.

### Color & Contrast (SC 1.4.3, 1.4.11)

**Text contrast:** 4.5:1 minimum for normal text, 3:1 for large text (18pt+ or 14pt+ bold).
**Non-text contrast:** 3:1 for UI components and graphical objects against adjacent colors.

**At token generation time:**
- When generating `:root` color tokens, calculate text-on-background combinations
- Any pair that fails 4.5:1 → **raise a finding** (`accessibility/contrast`), do not change the brand color
- Put the suggested passing shade *in the finding* as advice for the designer — never apply it to the tokens yourself

**At CSS generation time:**
- Calculate text/background, focus-ring/background, and icon-or-border/background combinations
- Build with the design's colors exactly as specified
- Any failing pair → finding, not a silent swap

**Contrast calculation:** Use the WCAG relative luminance formula. Pseudocode:

```
L1 = relativeLuminance(lighter color)
L2 = relativeLuminance(darker color)
contrast = (L1 + 0.05) / (L2 + 0.05)
```

When generating output, include a comment showing the measured ratio — and when it fails, note the finding rather than editing the value:
```css
.rnt-button--primary {
  background: var(--color-primary);     /* #1A73E8 */
  color: var(--color-neutral-0);        /* #FFFFFF — contrast 4.78:1 ✓ AA */
}

.rnt-chip--info {
  background: var(--color-info-2);      /* #5B8DEF */
  color: var(--color-info-9);           /* #1A73E8 — contrast 1.9:1 ✗ — see FND-001, built as designed */
}
```

### Focus indicators (SC 2.4.7, 2.4.11, 2.4.13)

**Every interactive element must have a visible focus indicator.**

Requirements:
- Use `:focus-visible` (not `:focus`) to avoid showing focus on mouse click
- Minimum 2px outline with sufficient contrast against the background
- Outline must be unobscured by other elements (SC 2.4.11 — new in 2.2)
- Focus appearance must be at least 2px thick adjacent to the element OR enclose the element (SC 2.4.13 — new in 2.2)

**Default focus pattern:**
```css
.acme-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

For elements where outline doesn't work (e.g., text inputs), use a box-shadow:
```css
.acme-input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary);
}
```

### Target size (SC 2.5.8) — new in WCAG 2.2

**All pointer targets must be at least 24×24 CSS pixels** (with some exceptions).

**Apply automatically (Tier 1) where the layout has room to grow:**
- Buttons (set `min-height` and `min-width`)
- Icon buttons
- Checkboxes, radios, switches
- Tab triggers
- Pagination controls

If the design specifies a fixed size smaller than 24px that can't grow without altering the layout, **flag it** (Tier 2, `accessibility/target-size`) rather than overriding the designer's dimensions.

```css
.acme-icon-button {
  min-width: 24px;
  min-height: 24px;
  /* Better: 44×44 for primary touch targets */
}
```

**Exceptions:**
- Inline links in text
- Targets in user agent default styling
- Targets the user has chosen to make smaller

### Keyboard operability (SC 2.1.1, 2.1.2)

Every interactive element must be operable via keyboard:
- `Tab` to focus
- `Enter` or `Space` to activate buttons
- `Arrow keys` to navigate within composite widgets (tabs, radios, menus)
- `Esc` to dismiss dialogs

**For Web Components:** Always implement keyboard handlers, never rely solely on click. Reference patterns in `references/keyboard-patterns.md`.

### Semantic HTML (SC 1.3.1, 4.1.2)

Prefer native elements over `<div>` with ARIA:
- ✅ `<button>` for clickable actions
- ✅ `<a href="...">` for navigation
- ✅ `<input>`, `<select>`, `<textarea>` for form fields
- ❌ `<div onclick="...">` (requires manual a11y work)
- ❌ `<span role="button">` (use `<button>` instead)

When generating Web Components, use semantic HTML inside the Shadow DOM.

### ARIA states (SC 4.1.2)

Apply automatically:
- `aria-pressed="true|false"` on toggle buttons
- `aria-expanded="true|false"` on disclosure widgets (accordion, dropdown)
- `aria-selected="true|false"` on tab/option states
- `aria-disabled="true"` (along with native `disabled` for focusability nuance)
- `aria-current="page|step|location"` for current item in navigation
- `aria-invalid="true"` + `aria-describedby="error-id"` on invalid form fields
- `aria-label` or `aria-labelledby` when visible text isn't enough

### Form labels (SC 1.3.1, 3.3.2)

Every form input needs an associated label:
```html
<!-- ✅ Via for/id -->
<label for="email">Email</label>
<input id="email" type="email">

<!-- ✅ Wrapping -->
<label>Email <input type="email"></label>

<!-- ❌ Placeholder is not a label -->
<input type="email" placeholder="Email">
```

### Error identification (SC 3.3.1, 3.3.3)

Errors must be:
- Identified in text (not just color)
- Associated with the input via `aria-describedby`
- Suggested with correction guidance when possible

```html
<label for="email">Email</label>
<input id="email" type="email"
       aria-invalid="true"
       aria-describedby="email-error">
<span id="email-error" class="acme-input__error">
  Please enter a valid email address (example: name@domain.com)
</span>
```

### Dragging movements (SC 2.5.7) — new in WCAG 2.2

If a component uses drag, provide a single-pointer alternative:
- Drag-to-reorder lists → also provide up/down buttons
- Drag-to-resize → also provide keyboard arrow keys or input
- Drag-to-slide → also provide arrow key support and click-to-position

### Consistent help (SC 3.2.6) — new in WCAG 2.2

If your design system includes help mechanisms (contact link, chat, help icon), they must appear in consistent locations across screens. Don't put the help button top-right on one screen and bottom-left on another.

This is a Style Guide / Template-level concern. Flag during Phase 1 audits.

### Redundant entry (SC 3.3.7) — new in WCAG 2.2

Don't ask users to re-enter information already provided in the same process (e.g., shipping address repeated as billing address must have an auto-fill option).

This is a screen-level/flow concern. Flag during Phase 1 audits when forms appear.

### Accessible authentication (SC 3.3.8) — new in WCAG 2.2

Don't require cognitive function tests for authentication unless an alternative is provided. This means:
- No "remember this image" or pattern-matching CAPTCHAs without alternatives
- No challenge questions without alternatives
- Passwords managed by browser/extension are fine

Flag during audit if a custom auth component is in scope.

### Motion (SC 2.3.3) — animations

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .acme-card {
    transition: none;
    animation: none;
  }
}
```

Apply this rule to every component that uses transitions or animations.

## Output integration

When called by another skill, the accessibility skill produces:

1. **Inline validation** during code generation:
   - Comments noting contrast ratios
   - ARIA attributes in HTML
   - Focus styles in CSS
   - Keyboard handlers in Web Components

2. **Audit report** for the component (added to Style Guide doc or audit output):

```markdown
## Accessibility Report (WCAG 2.2 AA)

✅ **Compliant:**
- Color contrast: 4.78:1 (text on primary)
- Focus indicator: 2px outline + 2px offset
- Touch target: 44×44px minimum
- Keyboard: Tab, Enter, Space supported
- Semantic HTML: <button> used
- ARIA: aria-pressed for toggle state
- Reduced motion: respected

⚠️ **Verify manually:**
- Screen reader announcement (test with VoiceOver/NVDA)
- Color blindness simulation (state not conveyed by color alone — has text label)

❌ **Not applicable:**
- Form validation (no form inputs in this component)
- Dragging movements (not used)
```

3. **Token-level findings** when checking tokens for AA compliance. These are raised via `outsystems-design-findings`, not applied to the tokens:

```
Contrast findings raised (tokens built as designed):
- FND-002 [accessibility/contrast, high]
  --color-neutral-5 on --color-neutral-1: 2.8:1 (FAILS 4.5:1)
  Recommendation for design: body text on light bg should use --color-neutral-7 (5.2:1).
  Implementation: left as designed; finding open.

- FND-003 [accessibility/contrast, medium]
  --color-primary on --color-neutral-2: 4.2:1 (passes large text only)
  Recommendation for design: reserve --color-primary for neutral-0/-1 backgrounds, or supply a darker brand shade.
  Implementation: left as designed; finding open.
```

After listing findings, hand off to `outsystems-design-findings` to write them to the register and route per project config.

## Hand-off to findings

Any Tier 2 conflict this skill detects is passed to `outsystems-design-findings`, which records it in the project's `findings/findings-register.md` and routes it (ticket + Slack) per project config. This skill detects and recommends; the findings skill tracks and routes.

## References

- `references/wcag-2-2-checklist.md` — Full WCAG 2.2 AA checklist for component reviews
- `references/contrast-calculator.md` — Contrast calculation formulas and color pair examples
- `references/keyboard-patterns.md` — Standard keyboard interaction patterns per component type
- `references/aria-recipes.md` — ARIA patterns for common OutSystems UI components
- `outsystems-design-findings` skill — where Tier 2 conflicts go to be tracked and routed
