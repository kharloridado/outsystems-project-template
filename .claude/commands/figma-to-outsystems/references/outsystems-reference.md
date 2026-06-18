# OutSystems Frontend Master Reference

Working reference for daily use.

## Quick facts
- **Platforms:** Reactive Web + ODC (not Traditional Web)
- **OutSystems UI:** v2.28.1+, BSD-3, 70+ patterns
- **IDE:** Service Studio (O11) / ODC Studio (ODC)
- **CSS:** kebab-case `:root` variables, BEM for custom classes
- **Customization:** Override tokens + ExtendedClass + Web Components for L5

## Architecture: O11 vs ODC

| Concept | O11 | ODC |
|---|---|---|
| Frontend module | Theme module | Theme Library |
| App composition | 4-Layer Canvas | One app = one module |
| Reusable assets | Patterns module | Patterns Library |
| Library entities | Allowed | NOT allowed |
| Deployment | LifeTime | ODC Portal |
| Style Guide | Forge app or custom | Forge id 16952 |
| Theme switching | Multiple Themes | Multi Theme Library |
| Versioning | Module versions | Semver on library publish |

## CSS layering
1. **OutSystems UI** (locked)
2. **Theme** — `:root` + global BEM
3. **Block CSS** — scoped to Block
4. **Screen CSS** — page-specific
5. **Widget inline Style** (avoid)

## Pattern catalog summary

**Content:** Accordion, Alert, Blank Slate, Card, Card Background, Card Item, Card Sectioned, Chat Message, Flip Content, Floating Content, List Item Content, Section, Section Group, Tag, Tooltip, User Avatar

**Interaction:** Action Sheet, Animate, Animated Label, Bottom Sheet, Carousel (Splide), Date Picker (Flatpickr), Range Slider (noUiSlider), Dropdown Search/Tags (VirtualSelect), Floating Actions, Input with Icon, Lightbox Image, Map, Notification, Scrollable Area, Search, Sidebar, Stacked Cards, Video

**Navigation:** Bottom Bar Item, Breadcrumbs, Pagination, Section Index, Submenu, Tabs, Timeline Item, Wizard

**Numbers:** Badge, Counter, Icon Badge

**Layout:** Columns, Display on Device, Gallery, Master Detail, Layout Base, Layout SideMenu, Layout Top, Layout Login, Login Split, Popup

## JavaScript API
- Public: `OutSystems.OSUI.*`
- Internal (don't use): `OSFramework.OSUI.*`
- Deprecated: `osui.*`

## Design token categories
```
Colors:     --color-{primary|secondary|neutral-0..10|success|error|warning|info}[-hover|-light|-dark]
Typography: --font-family-{body|heading|mono}
            --font-size-{display|h1..h6|base|xs..2xl}
            --font-weight-{light..black}
Spacing:    --space-{base|none|xs|s|m|l|xl|2xl|3xl}
Shape:      --border-radius-{none|soft|rounded|circle|pill}
            --border-size-{s|m|l}
Elevation:  --shadow-{none|xs|s|m|l|xl}
Layout:     --breakpoint-{small|medium|large}
Motion:     --animation-{duration|function}-*
```

## BEM
```
.{prefix}-{block}                       /* Block */
.{prefix}-{block}__{element}            /* Element */
.{prefix}-{block}--{modifier}           /* Block modifier */
```

## Escalation
- **L1** Token change
- **L2** Existing utility class
- **L3** ExtendedClass + BEM modifier
- **L4** Wrap pattern in custom Block
- **L5** Vanilla JS Web Component + Block wrapper
- **L6** Fork OutSystems UI (never)

## Web Component pattern
- Vanilla JS only (no Lit/Stencil)
- Shadow DOM (mode: 'open')
- Custom events with `composed: true`
- `:host` exposes CSS custom properties for theming
- Registration guard: `if (!customElements.get('acme-x')) { ... }`
- Always wrapped in OutSystems Block for end-developer use

## Service Studio gotchas
- Preview injects `-servicestudio` HTML attribute — pattern JS doesn't run
- Always validate in real browser (F5 publish → F6 open)
- Chrome Local Overrides for fast CSS iteration
- For Web Components: validate in browser only — Preview won't render them

## ODC versioning
- **Major** — Breaking (new mandatory input, removed input)
- **Minor** — Additive (new optional inputs, new Blocks)
- **Revision** — Bug fixes
- Apps consume frozen library versions until rebuilt

## Live Style Guide
- Contract between design and engineering
- Every component documented before production
- Forge: id 16952 (ODC), id 9470 (ACME)

## Community
- **Bernardo Cardoso** — framework architecture
- **Daniel Reis** — Live Style Guide methodology
- **Mário R. Andrade** — BEM in OutSystems
- **António Carvalho** — Comprehensive CSS Guide
- **Hi Interactive** — Figma workflow, ODC versioning
- **Mediaweb** — outsystems-ui-scss SCSS port
