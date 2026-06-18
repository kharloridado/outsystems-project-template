# Common BEM Patterns for OutSystems UI Components

Reference implementations for the most commonly customized OutSystems UI patterns. Replace `acme-` with the user's stored prefix.

## Card (extends OutSystems UI Card)

```css
/* ============================================
   Component: Card
   Pattern: OutSystems UI Card
   Location: Theme CSS
   Escalation Level: L3
   ============================================ */

.acme-card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-3);
  border-radius: var(--border-radius-soft);
  padding: var(--space-m);
  box-shadow: var(--shadow-s);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.acme-card__header {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semi-bold);
  color: var(--color-neutral-9);
  margin-bottom: var(--space-s);
}

.acme-card__body {
  font-size: var(--font-size-base);
  color: var(--color-neutral-7);
  line-height: 1.5;
}

.acme-card__footer {
  margin-top: var(--space-m);
  padding-top: var(--space-s);
  border-top: 1px solid var(--color-neutral-2);
  display: flex;
  gap: var(--space-s);
  justify-content: flex-end;
}

/* Variants */
.acme-card--featured {
  border-color: var(--color-primary);
  border-width: 2px;
}

.acme-card--compact { padding: var(--space-s); }

.acme-card--inverted {
  background: var(--color-neutral-9);
  border-color: var(--color-neutral-8);
}
.acme-card--inverted .acme-card__header,
.acme-card--inverted .acme-card__body { color: var(--color-neutral-1); }

/* States */
.acme-card--is-loading { opacity: 0.6; pointer-events: none; }
.acme-card--is-selected { border-color: var(--color-primary); }

/* Interactions */
.acme-card:hover { box-shadow: var(--shadow-m); transform: translateY(-2px); }
.acme-card:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
```

**ExtendedClass:** `"acme-card acme-card--featured"`

---

## Button (extends OutSystems UI Button)

```css
.acme-btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-s) var(--space-m);
  border-radius: var(--border-radius-rounded);
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s ease;
}

.acme-btn--primary { background: var(--color-primary); color: var(--color-neutral-0); }
.acme-btn--primary:hover { background: var(--color-primary-hover); }

.acme-btn--secondary {
  background: var(--color-neutral-1); color: var(--color-neutral-9);
  border: 1px solid var(--color-neutral-3);
}
.acme-btn--secondary:hover { background: var(--color-neutral-2); }

.acme-btn--ghost { background: transparent; color: var(--color-primary); }
.acme-btn--destructive { background: var(--color-error); color: var(--color-neutral-0); }

.acme-btn--sm { padding: var(--space-xs) var(--space-s); font-size: var(--font-size-s); }
.acme-btn--lg { padding: var(--space-m) var(--space-l); font-size: var(--font-size-l); }

.acme-btn--is-loading { color: transparent; position: relative; }
.acme-btn:active { transform: scale(0.98); }
.acme-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.acme-btn[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
```

---

## Tabs (extends OutSystems UI Tabs)

```css
.acme-tabs__header {
  display: flex; gap: var(--space-m);
  border-bottom: 1px solid var(--color-neutral-3);
}

.acme-tabs__tab {
  padding: var(--space-s) var(--space-m);
  color: var(--color-neutral-6);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.acme-tabs__tab:hover { color: var(--color-neutral-9); }

.acme-tabs__tab--is-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semi-bold);
}

.acme-tabs--pill .acme-tabs__header { border-bottom: none; gap: var(--space-xs); }
.acme-tabs--pill .acme-tabs__tab { border-radius: var(--border-radius-pill); border-bottom: none; }
.acme-tabs--pill .acme-tabs__tab--is-active {
  background: var(--color-primary); color: var(--color-neutral-0);
}
```

---

## Badge / Tag

```css
.acme-badge {
  display: inline-flex; align-items: center; gap: var(--space-xs);
  padding: 2px var(--space-s);
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
}

.acme-badge--success { background: rgba(22,163,74,0.12); color: var(--color-success); }
.acme-badge--error   { background: rgba(220,38,38,0.12); color: var(--color-error); }
.acme-badge--warning { background: rgba(245,158,11,0.12); color: var(--color-warning); }
.acme-badge--info    { background: rgba(14,165,233,0.12); color: var(--color-info); }
.acme-badge--neutral { background: var(--color-neutral-2); color: var(--color-neutral-7); }
```
