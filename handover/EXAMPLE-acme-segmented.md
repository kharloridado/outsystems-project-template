# Handover — acme-segmented + acme-button

Generated code ready to add into OutSystems. (Example body for a handover Task.)

## Files
| File | OutSystems destination |
|---|---|
| `src/blocks/acme-button.css` | Theme CSS (or Block CSS) |
| `src/components/acme-segmented.js` | Script resource (Theme Library), Include = When invoked |
| `src/components/acme-segmented.css` | Source of the shadow styles (embedded in the .js — edit here, sync into render()) |
| Block: `Segmented` | Patterns Library |

## Checklist
- [ ] Paste `acme-button.css` into Theme CSS; set Button `ExtendedClass = "acme-button acme-button--primary"`
- [ ] Import `acme-segmented.js` as a Script resource
- [ ] Create Block `Segmented`: inputs `Value`, `Options`, `Size`, `Disabled`; event `OnChange`; OnReady listener wiring `change` -> `OnChange(e.detail.value)`
- [ ] 1-Click Publish -> validate in browser at phone/tablet/desktop (never Service Studio Preview for Web Components)

## Open findings linked to this work
- (none) / FND-xxx ...
