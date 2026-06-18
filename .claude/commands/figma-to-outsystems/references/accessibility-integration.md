# How Accessibility Integrates with All Skills

The `outsystems-accessibility` skill is not a standalone trigger — it runs alongside every code-generation skill to enforce WCAG 2.2 AA by default.

## Integration points

### With `outsystems-token-extractor` (Phase 2)
**When tokens are generated:**
- Validate every color pair against WCAG contrast ratios
- Add inline comments showing ratios:
  ```css
  --color-neutral-7: #475569;  /* 7.93:1 on neutral-0 — passes AA */
  ```
- Flag failures with suggestions:
  ```
  ⚠️ --color-neutral-5 (#94A3B8) fails 4.5:1 against --color-neutral-0
  Suggestion: use --color-neutral-6 for body text
  ```

### With `outsystems-bem-css` (Phase 3, L3–L4)
**When CSS is generated:**
- Add `:focus-visible` styles to every interactive element
- Use `:focus-visible` (not `:focus`) to avoid showing focus on click
- Validate text-on-background contrast and add comment
- Add `prefers-reduced-motion` rules for any animations
- Include `min-height`/`min-width` for touch targets (24px min, 44px recommended)
- Use `[aria-disabled="true"]` selector alongside `:disabled` for state styling

Example generated CSS:
```css
.acme-button {
  min-height: 44px;
  min-width: 44px;
  background: var(--color-primary);
  color: var(--color-neutral-0);  /* 4.78:1 on primary — passes AA */
  transition: background 0.2s ease;
}

.acme-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.acme-button[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .acme-button { transition: none; }
}
```

### With `outsystems-web-component` (Phase 3, L5)
**When Web Component is generated:**
- Use semantic HTML inside Shadow DOM (`<button>`, not `<div role="button">`)
- Add keyboard handlers per pattern (`keyboard-patterns.md`)
- Add ARIA states automatically (`aria-pressed`, `aria-expanded`, `aria-selected`)
- Include `aria-label` or visible labels
- Touch targets ≥ 24×24 CSS pixels
- Focus management on open/close (e.g., for modals)
- `prefers-reduced-motion` respected for animations

### With `outsystems-component-audit` (Phase 1)
**When auditing a Figma design:**
- Flag potential accessibility issues alongside brand flags
- Check designed color contrast against WCAG
- Identify components that need keyboard alternatives (e.g., drag-only interactions)
- Identify components missing visible focus states in design
- Check minimum target sizes in designed buttons/touch points

Audit output gains a section:
```
♿ Accessibility Flags
- Designed button is 32×32px — must be ≥44×44 for touch targets
- Drag-to-reorder design needs keyboard alternative (Arrow keys + Space)
- Tab focus state not shown in design — propose 2px outline pattern
```

### With `outsystems-style-guide-doc` (Phase 4)
**When Style Guide doc is generated:**
- Mandatory Accessibility Report section
- Lists what's compliant, what to verify manually, what's not applicable
- Documents keyboard interactions
- Documents ARIA patterns used
- Notes specific WCAG SCs addressed

## Override mechanism

User can relax enforcement with explicit phrases:
- `"non-compliant override: [reason]"`
- `"skip accessibility for this"`
- `"intentionally non-compliant"`

When override is detected:
1. Generate what was asked
2. Add prominent warning at top of output
3. List specific violations
4. Include `// WCAG-OVERRIDE: [reason]` in code
5. Suggest how to bring it into compliance later

The override applies only to that specific output, not the rest of the conversation.

## What the accessibility skill checks (priority order)

1. **Color contrast** (every CSS generation)
2. **Focus visibility** (every interactive element)
3. **Semantic HTML** (every component)
4. **ARIA states** (every interactive component)
5. **Keyboard support** (every Web Component)
6. **Touch targets** (every interactive element)
7. **Reduced motion** (every animation/transition)
8. **Error identification** (every form input)
9. **Help consistency** (Phase 1 audits, screen-level)
10. **Redundant entry** (Phase 1 audits, form flows)

## What the accessibility skill does NOT do

- Doesn't replace manual screen reader testing
- Doesn't catch every edge case (some require human review)
- Doesn't write tests — flags issues, suggests fixes
- Doesn't override the user's design decisions when they explicitly opt out

## Final checks before "Approved"

Before marking any component Style Guide page as "Approved," verify:
- ✅ All AA criteria in `wcag-2-2-checklist.md` addressed
- ✅ Accessibility Report section completed
- ✅ Component tested with keyboard (Tab, Enter, Space, Arrow keys, Esc)
- ✅ Component tested at 200% zoom
- ✅ Component tested with `prefers-reduced-motion: reduce`
- ✅ Color contrast verified in DevTools or contrast checker
- ✅ Screen reader announcement tested (VoiceOver/NVDA/JAWS)
