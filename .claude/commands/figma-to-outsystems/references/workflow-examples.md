# Full Workflow Examples (v3)

End-to-end examples showing how all skills coordinate.

## Example 1: First-ever conversation, Figma URL shared

```
User: "Audit this Figma screen for me: figma.com/design/ABC123/AcmePortal"
```

**Claude's internal sequence:**
1. ✅ Check memory for `OutSystems convention:` — **MISSING** → invoke `outsystems-onboarding`
2. Onboarding presents 4 questions
3. User answers: `acme-`, ODC, 8pt, OutSystems UI standard
4. Memory stored
5. ✅ Check memory for `OutSystems project:` — **MISSING** → invoke `outsystems-project-context`
6. Project context detects "AcmePortal" in URL, asks 1 question to confirm
7. User confirms: customer = "Acme Corp", project = "Acme Portal"
8. Memory stored
9. Now run actual task: `outsystems-figma-integration`
10. Tool search for Figma, then call `Figma:get_design_context`, `get_variable_defs`, `get_screenshot`
11. Pass to `outsystems-component-audit` for classification
12. `outsystems-accessibility` runs alongside, validates colors, flags issues
13. Output Phase 1 audit with all sections

**User sees:**

```
[Brief onboarding flow with 4 + 1 questions]

✅ Got it — using acme- prefix, ODC, 8pt spacing, OutSystems UI tokens.
✅ Project: Acme Corp / Acme Portal

Pulling design from Figma...

✅ Figma data retrieved:
   - File: AcmePortal
   - Components found: 8 unique (12 instances)
   - Variables: 18 colors, 6 typography, 12 spacing
   
## Phase 1 Audit

### Component Inventory
| Element | Bucket | Pattern | Level | Notes |
|---------|--------|---------|-------|-------|
| Top nav | ✅ As-is | Layout Top + Menu | L1-L2 | Standard |
| Hero card | 🎨 Customize | Card Background | L3 | Gradient overlay |
| Pricing toggle | 🆕 Web Component | (none) | L5 | No OS UI match |

### Brand Consistency Flags
- ⚠️ Heading uses #1A1A2E (close to --color-neutral-9 = #1E293B)
- ⚠️ Card padding is 18px (not on 8pt scale)

### Token Deltas
+ Add: --color-accent: #FF6B35
+ Add: --shadow-2xl: 0 24px 48px rgba(0,0,0,0.18)

### ♿ Accessibility Flags
- ⚠️ Button design shows 32×32 — must be ≥44×44 (WCAG 2.2 SC 2.5.8)
- ⚠️ Card focus state not shown — propose 2px outline pattern
- ✅ Color contrast for primary text passes AA

### Implementation Plan
1. Update :root tokens → outsystems-token-extractor
2. Hero card → L3, outsystems-bem-css
3. Pricing toggle → L5, outsystems-web-component
4. Document → outsystems-style-guide-doc

Next steps available:
- Proceed with tokens
- Generate hero CSS
- Generate pricing toggle Web Component
- Do everything
```

## Example 2: Same project, Figma update

```
User: "Designer added new colors to Figma. Pull them and update the theme."
```

**Claude's internal sequence:**
1. ✅ Conventions in memory (skip onboarding)
2. ✅ Project context in memory: "Acme Corp / Acme Portal" — but no Figma URL provided this time
3. Ask: "Same Figma file as before, or new one?"
4. User confirms same file
5. `outsystems-figma-integration` calls `Figma:get_variable_defs` for the file
6. Pass to `outsystems-token-extractor`
7. `outsystems-accessibility` validates color contrast
8. Output the `:root` delta

**User sees:**

```
Pulling latest variables from Figma...

Detected token changes:
+ Added: --color-info-secondary: #38BDF8
+ Added: --color-success-bg: #DCFCE7
~ Changed: --color-primary from #1A73E8 → #2563EB

♿ Contrast validation:
- ✅ New --color-primary (#2563EB) on --color-neutral-0: 5.17:1 — passes AA
- ✅ White text on new --color-primary: 5.17:1 — passes AA
- ✅ New --color-success-bg (#DCFCE7) with --color-success text: 6.2:1 — passes

```css
/* Add to Theme module / Theme Library :root */
:root {
  /* ... existing ... */
  --color-primary: #2563EB;            /* 5.17:1 on neutral-0 — passes AA */
  --color-info-secondary: #38BDF8;     /* for info backgrounds */
  --color-success-bg: #DCFCE7;         /* light success background */
}
```

Where to paste: ODC Theme Library → Theme CSS

⚠️ Style Guide TODO: 
- Update Foundations/Colors swatch page
- New token specimens needed for info-secondary and success-bg

Want me to generate the commit message for this?
```

## Example 3: Build a Web Component

```
User: "Generate the pricing toggle component"
```

**Claude's internal sequence:**
1. Conventions + project in memory ✅
2. Recall from prior audit: pricing toggle = L5
3. Invoke `outsystems-web-component`
4. `outsystems-accessibility` enforces keyboard, ARIA, contrast, touch targets
5. Generate three deliverables:
   - `acme-pricing-toggle.js`
   - Block wrapper specs
   - Installation steps
6. Offer `outsystems-git-helpers` for commit

**User sees:**

```
Generating Web Component for L5 (no OS UI match)...

## Deliverable 1: acme-pricing-toggle.js

[Full vanilla JS Web Component code with:
- Shadow DOM (mode: 'open')
- Keyboard handlers (Arrow keys, Home, End)
- aria-pressed states
- Focus indicators
- Touch targets ≥ 44px
- prefers-reduced-motion respected
- Contrast-validated colors]

## Deliverable 2: PricingToggle Block Wrapper

[Block specs: Inputs, Events, Placeholders, markup, OnReady/OnDestroy]

## Deliverable 3: Installation

[5 steps from script upload to feature app usage]

## ♿ Accessibility Report (WCAG 2.2 AA)

✅ Compliant:
- Color contrast: 4.78:1 (text on active)
- Focus indicator: 2px outline + 2px offset
- Touch target: 44×44px minimum
- Keyboard: Arrow keys, Home, End, Tab, Enter, Space
- Semantic HTML: <button> elements
- ARIA: aria-pressed for state
- Reduced motion: respected

⚠️ Verify manually:
- VoiceOver/NVDA announcement test
- Color blindness simulation

Ready to commit? I can generate the commit message and PR description.
```

## Example 4: Commit message generation

```
User: "Yes, generate commit and PR"
```

**Claude's internal sequence:**
1. Invoke `outsystems-git-helpers`
2. Read memory for conventions + project context
3. Generate Conventional Commits-formatted message
4. Generate branch name
5. Generate PR description with a11y checklist

**User sees:**

```
## Commit Message
```
feat(wc/pricing-toggle): add Web Component for monthly/annual billing toggle

- Vanilla JS Web Component with Shadow DOM
- BEM internal classes (acme-pricing-toggle)
- Exposes --color-primary, --space-*, --font-* for theming
- Keyboard navigation: Arrow keys, Home, End
- WCAG 2.2 AA compliant:
  * 4.78:1 contrast (text on active state)
  * 2px focus outline + 2px offset
  * 44×44 touch targets
  * Reduced motion respected
  * aria-pressed states

Block wrapper: docs/blocks/PricingToggle.md

Customer: Acme Corp
Project: Acme Portal
Refs: ACME-145
```

## Branch Name
`feat/wc-pricing-toggle`

## PR Description
[Full PR template with a11y checklist filled in]

Commit via Claude Code or your IDE.
```

## Example 5: "Do everything"

```
User: [After Phase 1 audit] "Do everything"
```

**Claude's internal sequence:**
Proceeds without asking permission:
1. `outsystems-token-extractor` → generates :root updates
2. `outsystems-bem-css` → generates hero card CSS
3. `outsystems-web-component` → generates pricing toggle
4. `outsystems-style-guide-doc` → generates docs for both
5. `outsystems-git-helpers` → generates commit messages for each
6. `outsystems-accessibility` runs alongside throughout

Output is one long response with all artifacts organized by deliverable.
