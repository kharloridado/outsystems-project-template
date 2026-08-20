# `build/gate/` — the rendered-fidelity gate

Two deterministic Node scripts. They **measure and diff**; they never judge.

| | The question | Who answers | Cadence |
|---|---|---|---|
| Build time | *Is this right?* — the render vs the frozen Figma ref | the checker (an agent) | once per item |
| Every push | *Did this change?* — vs the committed baseline | `compare-measurements.mjs` | free, forever |
| On demand | *Is this still right?* — re-judge, no rebuild | `/outsystems-loop:revalidate` | when asked |

## Why these live in the template and not in the plugin

They are not *behaviour*. They are deterministic tooling that measures and diffs, exactly
like `build-theme.mjs` and `validate-theme.mjs`, and they sit here beside them. The plugin
holds the **instructions** for using them — when to probe, what a drift means, what may
never be relaxed — which is the part that actually goes stale when copied.

Consequence: a project picks up an improvement here by pulling the scaffold, not by
`/plugin update`. That is the same trade every other `build/` script already makes.

## `measure-fidelity.mjs`

```bash
node build/gate/measure-fidelity.mjs \
  --probes     loop/refs/<item-id>/probes.json \
  --out        loop/refs/<item-id>/measurements.json \
  --screenshot loop/refs/<item-id>/rendered.png
```

Run it from the **project root**. It starts and stops the preview server itself, drives a
headless browser, and reads `getComputedStyle` — never the authored source.

> A correct declaration in our source proves nothing. Framework and provider CSS
> out-specify it and win silently, so the review must cite the computed style.

**It never reads the ref**, so it cannot call drift. It reports numbers and an exit code;
the checker compares them to the ref. Keeping mechanism and judgment apart is what stops
the gate from grading itself.

### Exit codes — read these before you read any number

| Exit | Meaning | Verdict |
|---|---|---|
| `0` | every probe measured | compare to the ref → PASS or DRIFT |
| `3` | something could not be measured | `VISUAL: unverified` — **never** PASS |
| `4` | no usable browser, or the page never loaded | `VISUAL: unverified` — **never** PASS |
| `2` | usage fault (bad args, unreadable probe file) | also never PASS |

Any non-zero exit is a **harness fault, not a design verdict**.

### The failed-request rule

A failed **stylesheet, font or script** invalidates the entire viewport. A missing CSS file
does not throw — the cascade falls back and every computed value still reads as a perfectly
plausible number describing a page nobody will ever see. The commonest cause is
`vendor/outsystems-ui/` never being built:

```bash
git submodule update --init && npm run build:osui
```

### Probe file

```json
{
  "waitFor": ".prefix-button",
  "viewports": [{ "name": "desktop", "width": 1280, "height": 900 },
                { "name": "mobile",  "width": 375,  "height": 812 }],
  "probes": [
    { "name": "primary / fill", "selector": ".btn.is-primary",
      "props": ["background-color", "color", "font-size", "border-radius"] },
    { "name": "primary / box",  "selector": ".btn.is-primary", "rect": true },
    { "name": "icon glyph",     "selector": ".btn .icon", "pseudo": "::before", "ink": true },
    { "name": "registered",     "js": "!!customElements.get('x-toast')" }
  ]
}
```

- `props` — `getComputedStyle`; add `"pseudo": "::before"` for generated content.
- `rect` — `getBoundingClientRect`, for boxes and gaps.
- `ink` — paints the codepoint to a canvas and takes its **alpha bounding box**. Design
  tools inset a glyph inside its em box (icon-font ink is typically ~62.5% of the em), so
  `font-size` alone proves nothing about what the eye sees.
- `js` — escape hatch for anything the above cannot express.
- `index` — disambiguates when a selector matches several elements.

Optional top-level `url` (defaults to `/preview/index.html`) and `waitFor`.

**A ref row you did not probe is a row you did not check.**

## `compare-measurements.mjs`

```bash
node build/gate/compare-measurements.mjs --all                        # CI
node build/gate/compare-measurements.mjs --baseline a.json --current b.json
```

`--all` walks every `loop/refs/<id>/` that has both a `probes.json` and a committed
`measurements.json`, re-measures, and diffs. Every committed probe set is therefore a
permanent visual regression test, and the suite grows with each deliverable — so a token
change that breaks component #3 is caught while building component #9.

### The comparison is typed by stability

This detail is load-bearing:

- **Computed strings** (colour, `font-family`, `font-size`, radius, weight) are
  environment-stable and diff **exactly**. A diff here is a **regression** and fails CI.
  The highest-value catch — a webfont silently falling back to a system stack — is a
  `font-family` string diff, and that is perfectly stable.
- **`rect` / `ink` geometry** depends on font rasterisation and is compared with a
  tolerance (default 1.5 px), reported as **informational** only.

A naive deep-equal would fail every pull request on sub-pixel noise, and a gate that cries
wolf every time teaches people to click through it — at which point it misses the real
regression too.

### There is deliberately no `--update`

A baseline is a **judged** artifact. Refreshing one without re-judging would launder an
unreviewed change into the record. If a token change is intentional, re-judge the item with
`/outsystems-loop:revalidate`.

## `npm run gate:selftest`

Measures `selftest.html`, a self-contained page with no theme, no vendor CSS and no
webfont. It proves the **harness** works — browser launches, server serves, all five probe
kinds read — independently of any project build output.

When the self-test passes and a real probe run does not, the fault is in the project, not
the gate. That is the difference between an exit `3` you fix with `npm run build:osui` and
an exit `4` you fix by installing a browser.

## The browser

`playwright-core` against an **installed Chrome or Edge** — no 140 MB Chromium download.
Resolution order: `GATE_BROWSER_PATH` → `chrome` → `msedge` → `chromium`. GitHub's
`ubuntu-latest` runners ship Chrome, so CI takes the same path with no extra setup.

If you would rather have a pinned, bundled browser, `npm i -D playwright` and set
`GATE_BROWSER_PATH` — nothing else changes.
