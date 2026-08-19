---
name: runtime-ui-audit
description: Audit a live runtime URL against the 16-criterion UI Quality Assessment rubric. Use when the user asks to "audit this runtime", "check the live app", "review the deployed screen", "score the running app's UI", or gives a runtime link and wants a UI quality assessment. Captures screenshots (desktop + mobile), a shallow in-app crawl, interaction states (focus ring, hover), and a mechanical probe (tap-target sizes, motion signals), then scores each criterion Market Leading→Broken with evidence and a weighted total + tier. Read-only — never modifies the app.
---

# Runtime UI Audit

You're auditing a **live runtime** — a deployed app reached by URL — against the **UI Quality Assessment** rubric in [`rubric.md`](rubric.md) next to this file. Unlike [`review-ui-implementation`](../review-ui-implementation/SKILL.md) (which greps the OML/theme to judge *how it was built*), this skill judges *what the user sees and experiences* from captures of the running app.

> **Full rubric (canonical):** [`rubric.md`](rubric.md). Read it before scoring — it defines the 16 criteria, tier boundaries, weights, and N/A rules. When a criterion's intent is ambiguous, that file wins.

## Read-only contract

This skill **never modifies** the app or the codebase. It navigates a URL, captures artifacts, and reports. No edits, no deploys, no "fixed it." If the user asks for fixes after the audit, that's a separate task.

## Scope & assumptions

- **Access:** the runtime URL is assumed **public / no auth**. If a capture lands on a login page, consent wall, or error screen *instead of* the app, **stop and tell the user** — do not score a login form as if it were the app. (Auth-gated runtimes are out of scope.) A landing page that merely *links* to a login is fine — that login is one of the shallow-crawl surfaces, not the audit target.
- **Captures:** landing URL at **desktop 1440×900 + mobile 390×844**, plus a **shallow crawl** of a few in-app surfaces, **interaction states** (focus ring, hover before/after), and a **mechanical probe** (`probe.json`) with measured tap-target sizes and computed motion/transition/focus signals. This is what lets the accessibility (C6) and behaviour (C10–C12) criteria be scored rather than defaulted to N/A.
- **Rubric:** 16 criteria, 6 categories. Per-criterion tier ∈ {Market Leading=4, Delightful=3, Acceptable=2, Unpleasant=1, Broken=0, N/A}. Weights: C1–C13 = 1×, C14/C15/C16 = 1.5×. See scoring below.

## Inputs to gather first

| Input | Required? | Notes |
|---|---|---|
| Runtime URL | **Required** | The live link to audit. If missing, ask — do not guess. |
| Output path | Optional | Defaults to `output/<slug>/runtime-audit.md` (`<slug>` from URL host+path). |
| Max crawl screens | Optional | Defaults to 4. Pass `Max screens: 0` to disable crawling. |
| Viewports | Optional | Defaults to `desktop,mobile`. |

## Step 1 — Capture

Capture with Playwright driving the **system Google Chrome** (no Chromium download). The script ships next to this skill at `capture.mjs`. Node resolves ESM imports relative to the **script's own directory**, so copy it into a working dir where `playwright` is installed and run it there — do not run it in place from the skill folder.

```bash
SKILL_DIR=".claude/skills/runtime-ui-audit"
WORK="$SCRATCHPAD/rua"                 # use your session scratchpad dir
URL="<runtime url>"

mkdir -p "$WORK" && cd "$WORK"
npm i playwright >/dev/null 2>&1        # JS package only (~1s), no browser download
cp "$OLDPWD/$SKILL_DIR/capture.mjs" .
node capture.mjs "$URL" ./shots         # add --max-screens=N or --no-crawl / --viewports=desktop as needed
```

The script writes into `./shots/` and prints one JSON line per capture plus a final `{probe:...}` summary:

| Artifact | Feeds |
|---|---|
| `desktop.png`, `mobile.png` | landing, full-page — primary evidence for most criteria (C1–C5, C7, C8, C13, C14, C16) |
| `screen-NN-<slug>.png` | crawled in-app surfaces — C9 app depth, C10 states (empty/detail/error screens) |
| `focus.png` + `probe.focus` | C6 keyboard — the focused element and its computed outline |
| `hover-before.png` / `hover-after.png` + `probe.hover` | C12 micro-interactions — resting vs hover |
| `probe.tapTargets` | C5 — measured bounding boxes, `pctGte44`, and a sample of undersized controls |
| `probe.motion` | C11/C12 — count of elements with transitions, durations, and whether `prefers-reduced-motion` is handled |
| `session.webm` | C11 — a recording for optional human review (you can't watch it; use `probe.motion` + hover pair) |

- **Sanity-check the printed desktop `title`/`url`.** If the final `url` is a login/SSO host or the title reads like an error/login page, the app is auth-gated — stop and report (see Scope).
- If `channel: 'chrome'` fails (no system Chrome), run `npx playwright install chromium` once and drop the `channel` option in your working copy. Note the fallback in the report's Method section.

## Step 2 — Read the captures and score each criterion

Read every PNG with the Read tool (it renders images), and read `probe.json` for the mechanical signals. Judge **desktop** as the primary artifact; use **mobile** to check responsive breakage (overflow, clipping, collapse) and the **crawled screens** for app depth and states.

For each of the 16 criteria in [`rubric.md`](rubric.md):

1. **Gather evidence** from the relevant capture(s) + probe signals.
2. **Map to a tier** (Market Leading / Delightful / Acceptable / Unpleasant / Broken) using the rubric's tier definitions, or **N/A** per its rules.
3. **Record** `{criterion, tier, score_value, weight, evidence}`. Evidence MUST be concrete — a hex colour you see, a named component, a measured value from `probe.json`, a region ("the two hero cards"), a measured misalignment. Never a generalization. **C14 and C15 must include their numeric 1–5 score in the evidence.**

**How the probe resolves the criteria that would otherwise be N/A:**
- **C5 Tap targets** — use `probe.tapTargets.pctGte44` against the rubric bands (100 / ≥95 / 80–94 / 60–79 / <60). The measured sample is authoritative over eyeballing.
- **C6 Keyboard** — `probe.focus`: no focus state → N/A; a **default** browser ring (`outlineStyle: auto`, browser blue, no custom design) caps at **Acceptable**; a designed, consistent ring → Delightful+. Confirm the ring is visible in `focus.png`.
- **C11 Animations** — `probe.motion`: transitions present with sane durations (0.15–0.25s) but `prefersReducedMotionHandled:false` caps at **Acceptable**; zero transitions and no recording insight → lean Unpleasant/N/A per what's observable.
- **C12 Micro-interactions** — compare `hover-before.png`/`hover-after.png` and `probe.hover.changed` plus per-element transitions; inert hover + no other crafted moments → Unpleasant.
- **C10 State Communication** — score only if a loading/error/empty/completion state appears in any capture (often a crawled screen); otherwise N/A.
- **C9 IA & App Depth** — use the crawl: a landing page that leads only to a login is legitimately **shallow** (Unpleasant/Acceptable) — score the depth actually observed, don't assume unseen depth.

Calibration guards (these trip up automated evaluators):
- **Don't invent failures for absent things.** No shadows anywhere is not automatically a fail; one instance of a component type is coherent unless there's an obvious conflict.
- **OutSystems-default tells are the highest-signal mechanical checks:** primary/CTA `#1068eb` or background `#f3f6f8` drag down C1, C14, and C16 hard. Call them out explicitly when present.
- **Charts and user-submitted content (avatars, thumbnails) are exempt** from palette/consistency criteria (C1).
- **N/A is a real answer.** Prefer it over guessing. If ≥ 6 criteria are N/A, the score is flagged low-confidence.

## Step 3 — Compute the score

```
Numerator   = Σ  score_value(i) × weight(i)          [non-N/A only]
Denominator = Σ  4 × weight(i)                        [non-N/A only]
Final %     = round( Numerator ÷ Denominator × 100 )
```

Weights: C1–C13 = 1×, C14/C15/C16 = 1.5×. Map the % to an overall tier:

| Range | Tier |
|---|---|
| ≥ 85% | Market Leading |
| 65–84% | Delightful |
| 45–64% | Acceptable |
| 25–44% | Unpleasant |
| < 25% | Broken |

Flag **low-confidence** if ≥ 6 criteria are N/A.

## Step 4 — Output format

Produce a Markdown report **and write it to a file** (default `output/<slug>/runtime-audit.md`; overwrite if present). Copy the captures into an adjacent `shots/` folder and embed them by relative path so the report is self-contained. Lead with the headline, then the table, then per-criterion evidence. After writing, tell the user the path and print the headline + table to the conversation.

```markdown
# UI Quality Audit — <app / URL>

**Final score: <NN>%** → **<Tier>**
- Numerator: <N> · Denominator: <D> · N/A count: <K> <flag low-confidence if K≥6>
Audited: `<url>` · captures: desktop 1440×900, mobile 390×844, <M> crawled surfaces, focus + hover, probe.json

## Per-criterion scores

| # | Criterion | Tier | Score | Weight | Evidence |
|---|---|---|---|---|---|
| 1 | Theme & Styling | Delightful | 3 | 1× | One violet brand accent + neutrals; soft shadows; consistent ~16px radius; not the `#1068eb`/`#f3f6f8` defaults |
| 5 | Tap / Click Target Size | Unpleasant | 1 | 1× | probe: 60% of 10 interactive targets ≥44px (4 nav text-links ~28px tall) |
| 6 | Keyboard Interaction | Acceptable | 2 | 1× | focus.png: default browser ring only (`outline: auto`, blue) on "Log in" — visible but not designed |
| 11 | Animations | Acceptable | 2 | 1× | probe: 10/10 elements transition at 0.2s, but prefers-reduced-motion NOT handled |
| … |
| 14 | Modern vs. Dated | Delightful | 3 (4/5) | 1.5× | Soft shadows, generous whitespace, custom violet accent; no OS default tells |

## Notable findings

- <worst hits first — e.g. "40% of tap targets under 44px", "no reduced-motion support">
- <patterns worth fixing first>

## Screenshots

![desktop](./shots/desktop.png)
![mobile](./shots/mobile.png)
<embed a crawled screen or focus.png when it carries a finding>

## Method

- URL audited: `<url>` (final URL after redirects: `<final>`)
- Captures: Playwright + system Chrome — desktop + mobile full-page, <M> crawled surfaces, focus/hover states, probe.json, session.webm
- Rubric: UI Quality Assessment (16 criteria / 6 categories)
- Criteria mechanically supported: C5 (tap-target probe), C6 (focus probe), C11/C12 (motion + hover probe)
- N/A: <list which criteria and why>
```

## Batch mode

If the user passes multiple URLs, run Steps 1–4 per URL (each to its own `output/<slug>/runtime-audit.md`) and finish with a comparison table:

| App / URL | Score | Tier | Worst criterion | Best criterion |
|---|---|---|---|---|
| app-a | 58% | Acceptable | C5 Tap Targets (Unpleasant) | C14 Modern (Delightful) |

## What this skill does NOT do

- Does not modify, deploy, or fix the app.
- Does not attempt to log in; the crawl stays within the app's public path.
- Does not inspect the OML/theme/CSS — that's [`review-ui-implementation`](../review-ui-implementation/SKILL.md).
- Does not produce vibes-based scores — every tier cites a concrete observation or a `probe.json` measurement.

If you cannot capture a usable landing screenshot (auth wall, error page, blank render), say so and stop. Prefer reporting the blocker over scoring a page that isn't the app.
