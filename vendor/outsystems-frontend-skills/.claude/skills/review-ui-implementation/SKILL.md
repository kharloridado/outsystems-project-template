---
name: review-ui-implementation
description: Score an OutSystems UI implementation against the 16-criterion UI Implementation Quality Assessment rubric. Use when the user asks to "review this app", "score the UI implementation", "judge UI quality", "rate the generated app", or wants a quality assessment of an OML produced by ModelAPI / agent. Produces evidence-backed scores per criterion, a weighted total, and a tier. Read-only — never modifies the implementation.
---

# Review UI Implementation

You're scoring an OutSystems UI implementation (typically a ModelAPI-generated app) against the **UI Implementation Quality Assessment** rubric. The rubric's tier definitions and weights live in [`rubric.md`](rubric.md) next to this file — this skill is the *mechanics* of applying it: what to grep, what to read, what to leave for human review.

> **Full rubric (canonical):** [`rubric.md`](rubric.md). Read it before scoring — it defines what each tier means per criterion. When tier definitions seem ambiguous, that file wins. The team-canonical mirror is on [Confluence](https://outsystemsrd.atlassian.net/wiki/spaces/RDMBLVS/pages/6374293544/UI+Implementation+Quality+Assessment+Rules+and+Guidelines); reconcile separately if they drift.

## Read-only contract

This skill **never modifies** the implementation. No edits, no rewrites, no "fixed it for you." Only inspection and reporting. If the user asks for fixes after the review, that's a separate task.

## Inputs to gather first

Ask the user for these (or accept them as args) before scoring:

| Input | Required? | Where it usually lives |
|---|---|---|
| Final OML path (or app folder) | **Required** | `output/<app>/*.oml` (binary — extract to text first, see [Prepare greppable artifacts](#prepare-greppable-artifacts-first-the-raw-oml-is-binary)) |
| Theme StyleSheet | **Required** | Inside the OML; extract via `oml query` in the prep step (not a loose file) |
| Spec / blueprint JSON | Recommended | `output/<app>/blueprint.json` or equivalent |
| Base OML (pre-generation) | Recommended | `oml/initial.oml` or the user-supplied starting OML |
| Live-preview screenshots / app URL | Optional | For visual cross-check |

**No spec available** → C9 Spec Fidelity is N/A. **No base OML** → C10 Entity & Theme Reuse is N/A (greenfield). **All screens single-column** → C8 Layout Container Discipline may be N/A. Apply the [default N/A rules](rubric.md#scoring-system) from the rubric.

## How to score one criterion

For each of the 16 criteria:

1. **Gather evidence** using the inspection recipe below (or human review note for judgment-heavy ones).
2. **Map evidence to a tier** using the rubric's tier definitions (Production-ready / Solid / Functional / Hacky / Broken / N/A).
3. **Record**: `{criterion, tier, score_value, weight, evidence: "<concrete quote / count / file:line>"}`. Evidence MUST be a concrete observation, not a generalization.

Score values: Production-ready=4 · Solid=3 · Functional=2 · Hacky=1 · Broken=0
Weights: C1–C13 → 1× · C14, C15, C16 → 1.5×

## Prepare greppable artifacts first (the raw `.oml` is binary)

A `.oml` is a **binary** file, not XML. Grepping it directly returns zero hits — none of the recipes below work against the raw file. Before scoring, convert it to text using the **`OutSystems.Cli` `oml` commands** (the `OutSystems.AI.Cli` binary, usually on PATH as `rd-ai-dotnet-cli`; `oml --help` lists the subcommands):

```bash
OML_SRC="output/<app>/result.oml"           # the binary OML under review

# 1. Greppable graph dump → this is what every "$OML" recipe below greps.
rd-ai-dotnet-cli oml xre "$OML_SRC" /tmp/review.xre && export OML=/tmp/review.xre

# 2. Theme StyleSheet CSS → this is "$CSS".
#    ⚠️ CRITICAL: `oml xre` STRIPS the theme StyleSheet fields — they do NOT appear in the
#    XRE graph dump. Grepping the XRE for CSS (`:root`, `.class {`, `--var:`) returns ZERO
#    hits even when the app has 16 KB of custom theme CSS. You MUST pull it via `oml query`.
#    The custom CSS lives on the app theme's `UserStyleSheet` (authored source) / `StyleSheet`
#    (compiled) — NOT on screens (screen StyleSheets are usually empty; some apps do dump CSS
#    into IMobileScreen.StyleSheet, so check both — see below).
#    `oml query` reads the GraphQL query from a file/stdin (not an inline arg); it wraps the
#    input as `query ModelQuery { <your selection> }`, so pass ONLY the inner selection.
rd-ai-dotnet-cli oml query "$OML_SRC" \
  <(echo 'Root { ... on IESpace { MobileThemes { Name StyleSheet UserStyleSheet } } }') \
  > /tmp/theme_raw.json
#    Then write the non-empty UserStyleSheet (fallback: StyleSheet) of the app theme to $CSS:
python3 - "$OML_SRC" <<'PY'
import json,subprocess,sys
raw=json.load(open('/tmp/theme_raw.json'))
themes=raw['data']['Root']['MobileThemes']
# pick the app theme = the one with the most custom CSS (skip EmailTheme)
best=max(themes, key=lambda t:len((t.get('UserStyleSheet') or '')+(t.get('StyleSheet') or '')))
css=best.get('UserStyleSheet') or best.get('StyleSheet') or ''
open('/tmp/review.css','w').write(css)
print(f"theme={best['Name']}  css_len={len(css)}",file=sys.stderr)
PY
export CSS=/tmp/review.css
export SPEC="output/<app>/spec.json"         # if provided

# 2b. Some apps ALSO (or instead) put CSS in per-screen StyleSheets. Check and append:
#     query `Root { ... on IESpace { ... } }` won't reach these easily — instead the screen
#     StyleSheet IS present in the XRE as IMobileScreen.StyleSheet, so extract from the XRE:
python3 - <<'PY'
import json
d=json.load(open('/tmp/review.xre'))
extra=[]
for n in d['nodes']:
    if isinstance(n,dict) and n.get('_type')=='IMobileScreen':
        ss=n.get('StyleSheet') or ''
        if ss.strip(): extra.append(f"/* screen {n.get('Name')} */\n{ss}")
if extra:
    open('/tmp/review.css','a').write("\n\n/* ===== per-screen StyleSheets (appended) ===== */\n"+"\n\n".join(extra))
    print(f"appended {len(extra)} screen stylesheet(s) to $CSS")
PY
```

The agent should run these itself, then point `$OML`/`$CSS`/`$SPEC` at the extracts. **Verify `$CSS` is non-empty before scoring the style-architecture criteria (C4–C7, C14).** An empty `$CSS` combined with widgets that reference custom classes (e.g. `ft-*`, `wb-*`) does NOT mean the classes are undefined no-ops — it almost always means the theme CSS wasn't extracted (step 2 skipped or the wrong theme picked). Confirm the class DEFINITIONS are present in `$CSS` (`grep -oE '\.[a-z][a-z0-9-]+\s*\{' "$CSS" | sort -u`) before concluding anything is undefined. **Caveat:** widget `Style` props are stored as `ExpressionAST` nodes in the XRE (with the literal class string on a child `Text.TextValue`), not literal class-string attributes — so per-widget class-token enumeration is only partially mechanical. Adjust the grep patterns below to XRE node names, and treat the theme StyleSheet (`$CSS`) + the spec's `theme_extensions` as the source of truth for class/variable findings.

## Inspection recipes

Run these against the **extracted** `$OML` (XRE text dump) and `$CSS` (theme StyleSheet) from the prep step above — never the raw binary `.oml`. Grep for widget/node types, Style strings, and argument values; treat the theme StyleSheet as the CSS source of truth.

### C1 — Block Selection [mechanical]

Goal: find hand-rolled CSS approximations of patterns that have native blocks.

```bash
# Avatars built as Container + border-radius: 50% instead of UserAvatar
grep -n 'border-radius:\s*50%' "$CSS"                            # candidate avatar shapes
grep -n 'IMobileBlockInstanceWidget.*UserAvatar' "$OML"          # actual UserAvatar usage
# If border-radius:50% hits >> UserAvatar usage, hand-rolled avatars are likely.

# Notification badges built as absolutely-positioned divs
grep -n 'position:\s*absolute.*top:\s*-' "$CSS"
grep -nE 'IconBadge|Badge' "$OML"

# Pagination as IButtons with active/inactive classes
grep -nE 'arrow-btn|pagination-button|nav-btn' "$CSS"
grep -n 'Pagination' "$OML"

# Filter pills mis-modeled as Tabs (look for Tabs blocks with empty Content placeholders)
grep -n 'Tabs.*Placeholder.*Content' "$OML"   # adjust to actual XML shape

# Hand-rolled charts (look for SVG / dasharray in widget Style)
grep -nE 'stroke-dasharray|<svg' "$OML"
grep -n 'OutSystemsCharts' "$OML"
```

**Tier mapping:** count hand-rolled approximations across the listed patterns. 0 → Production-ready · 1–2 minor → Solid · 2–3 medium → Functional · multiple major → Hacky · systematic → Broken.

### C2 — Block Configuration [partial-mechanical]

```bash
# IButtons missing the 'btn' base class
grep -nE 'IButton[^>]*Style="[^"]*"' "$OML" | grep -v 'btn'

# Block argument values using raw strings instead of Entity expressions
grep -nE 'Size.*"Medium"|Size.*"Small"|Size.*"Large"' "$OML"     # should be Entities.Size.*

# Default placeholder content NOT cleared before adding widgets (manual inspection)
# Look for IconBadge instances and inspect their Icon placeholder for default content alongside added widgets.
```

**Human review needed for:** idiomatic argument typing across the whole OML; placeholder cleanup. Mechanical pre-pass narrows the surface.

### C3 — Common Block Extraction [partial-mechanical]

```bash
# Inventory Common UIFlow blocks
grep -nE 'UIFlow.*Common.*Block|Common.*UIFlow.*Block' "$OML"

# Count widget-pattern repetition across screens
# (e.g. status badge with same class set appearing on N screens)
grep -nE 'class="[^"]*status-badge[^"]*"' "$OML" | wc -l
```

**Human review needed for:** judging whether a pattern *should* have been extracted. Mechanical pass gives counts; you decide if 4 inline duplicates warrants Common extraction.

### C4 — Theme Extensions Discipline [mechanical]

```bash
# Count :root blocks (should be exactly 1)
grep -c '^:root' "$CSS"

# Find duplicate rules (same selector appearing 2+ times)
grep -nE '^\.[a-zA-Z_-]+\s*\{' "$CSS" | awk '{print $2}' | sort | uniq -d

# Find undefined extended_class tokens — extract all tokens used in OML Style attrs,
# diff against utility class catalog + declared custom classes
grep -oE 'Style="[^"]*"' "$OML" | grep -oE '[a-z][a-z0-9-]+' | sort -u > /tmp/used_classes.txt
# Then compare against known utilities + declared custom classes in $CSS
```

**Tier mapping:** 1 :root, zero duplicate rules, zero undefined tokens → Production-ready. >1 :root or any duplicate rule → drops the tier.

### C5 — CSS Variables for Repeated Values [mechanical]

```bash
# Hex codes appearing 2+ times in rules (excluding :root declarations)
grep -hoE '#[0-9a-fA-F]{3,8}' "$CSS" | sort | uniq -c | sort -rn | awk '$1 > 1'

# px values appearing 2+ times in rules
grep -hoE '[0-9]+px' "$CSS" | sort | uniq -c | sort -rn | awk '$1 > 2'  # threshold loose
```

If common hex/px values appear in 2+ class bodies but NOT as `var(--...)`, that's a missed tokenization.

### C6 — Utilities-First Custom CSS [partial-mechanical]

```bash
# For each custom class, count properties that have utility equivalents
# (display, flex, align-items, justify-content, gap, border-radius from the OS UI utility scale, etc.)
# This is a heuristic — flag classes with 3+ properties that match utility names.
awk '/^\./{cls=$0; cnt=0} /display:|align-items:|justify-content:|flex:|column-gap:|row-gap:|border-radius:/{cnt++} /^}/{if(cnt>=3) print cls": "cnt" utility-equivalent props"}' "$CSS"
```

**Human review needed for:** judging whether a property has a utility equivalent in the OS UI catalog (`styles-and-utilities.md`). Mechanical pass surfaces candidates.

### C7 — `!important` Hygiene [mechanical]

```bash
grep -c '!important' "$CSS"                                    # total count
grep -nE '\{[^}]*!important[^}]*!important[^}]*!important' "$CSS"  # classes with 3+ !important in one block
```

**Tier mapping:** 0 → Production-ready · 1–2 → Solid · 3–5 → Functional · 6+ or any class with 3+ !important → Hacky · pervasive → Broken.

### C8 — Layout Container Discipline [partial-mechanical]

```bash
# column-gap / row-gap utilities on non-flex containers (silent no-ops)
# Find Style="..." strings containing column-gap-* without display-flex
grep -oE 'Style="[^"]*column-gap[^"]*"' "$OML" | grep -v 'display-flex'
```

**Human review needed for:** right-aligned column patterns (flex-1 + shrink-0), justify-content on the correct container.

### C9 — Spec Fidelity [partial-mechanical]

Requires the spec JSON. Extract hex/px values from spec and diff against theme + OML.

```bash
# Pull all hex values from spec
jq -r '.. | strings? | select(test("#[0-9a-fA-F]{3,8}"))' "$SPEC" | grep -oE '#[0-9a-fA-F]{3,8}' | sort -u > /tmp/spec_hex.txt
# Pull all hex from CSS
grep -hoE '#[0-9a-fA-F]{3,8}' "$CSS" | sort -u > /tmp/css_hex.txt
# Spec hex values missing from CSS
comm -23 /tmp/spec_hex.txt /tmp/css_hex.txt
```

Also diff icon sizes, shadow values, font sizes. **Charts in spec → present in OML?** `jq '..|.type? | select(.=="chart")' "$SPEC"` then cross-check against `grep OutSystemsCharts "$OML"`.

**N/A** if no spec available.

### C10 — Entity & Theme Reuse [partial-mechanical]

Requires the base OML and final OML.

```bash
# Entity diff
diff <(grep -oE 'Entity[^>]*Name="[^"]+"' "$BASE_OML" | sort -u) \
     <(grep -oE 'Entity[^>]*Name="[^"]+"' "$OML"      | sort -u)
# Look for: deletions (bad), duplicates like "Customer2" (bad), pure additions (fine).

# Theme variable replacements vs overrides
diff <(grep -E '^\s*--[a-z-]+:' "$BASE_CSS") <(grep -E '^\s*--[a-z-]+:' "$CSS")
```

**N/A** for greenfield apps.

### C11 — Auth Configuration [mechanical, binary-leaning]

```bash
# OML corruption check — should be zero
grep -nE 'eSpace\.RegisteredRole' "$OML"

# Screens marked IsAnonymous
grep -nE 'IsAnonymous="(true|false)"' "$OML"
```

Any `eSpace.RegisteredRole` hit → **Broken** for this criterion regardless of other evidence.

### C12 — Chrome Placement [partial-mechanical]

```bash
# Was Common/UserInfo touched?
grep -nE 'UIFlow.*Common.*UserInfo|Common.*UIFlow.*UserInfo' "$OML"
# Chrome-shaped widgets (avatar, bell, app-title) in per-screen Header placeholders?
grep -nE 'Placeholder.*Header.*UserAvatar|Header.*IconBadge.*bell' "$OML"
```

If chrome widgets appear in screen Headers but Common/UserInfo is unmodified → Broken / Hacky.

### C13 — Action Property Coverage [partial-mechanical]

```bash
# Interactive widgets and whether they have an OnClick / OnNotify wiring
grep -cE 'IButton|ILink' "$OML"                                  # total interactive
grep -cE '(IButton|ILink)[^>]*OnClick=' "$OML"                   # with action

# Click-on-row Containers — these are harder; manual review
```

Ratio of wired interactive widgets to total → tier (≥95% → Production-ready · 80–94% → Functional · <60% → Broken).

### C14 — Block-Native Treatment vs CSS Override [partial-mechanical, 1.5×]

```bash
# The popover-root width trap — CRITICAL check
grep -nE '\.(user-info|sidebar|bottom-sheet|dropdown|floating-content|notification)[^{]*\{[^}]*width:\s*[0-9]+%' "$CSS"

# Any rule with !important targeting block-rendered class names
grep -nE '\.(btn-|pagination-|tabs-|card-)' "$CSS" | grep '!important'
```

Any popover-root percentage width → drops to Hacky or Broken. Any pattern of `!important` on block-rendered class names → drops the tier.

### C15 — Domain Content Fidelity [human review, 1.5×]

Mostly human inspection. Mechanical pre-pass:

```bash
# Filler placeholders that shouldn't ship
grep -niE 'lorem ipsum|TBD|FIXME|placeholder|click to add content|User 1|Product 1|Project 2' "$OML"

# Unsanitized real-brand mentions (financial)
grep -niE 'Visa|Mastercard|American Express|PayPal' "$OML"

# UUID-shaped strings exposed in TextWidget content
grep -nE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "$OML"
```

**Otherwise human review** — judging "feels authored" vs "feels assembled" is not mechanical.

### C16 — Conditional Rendering & State Narrative [human review, 1.5×]

```bash
# Are there ANY conditional Style strings? (presence check for N/A determination)
grep -nE 'If\(|Visible="' "$OML" | head -20

# EmptyState / SkeletonScreen block usage
grep -nE 'EmptyState|Skeleton' "$OML"
```

**Mostly human review.** Mechanical pass tells you whether the criterion is N/A; tier mapping requires reading the spec and OML side by side.

## Output format

Produce a single Markdown report **and write it to a file** named `{oml-name}-judge.md`, where `{oml-name}` is the final OML's filename without its `.oml` extension. Write the file next to the OML (same directory) — e.g. reviewing `output/wallet/wallet.oml` writes `output/wallet/wallet-judge.md`. Use the Write tool; overwrite if it already exists. After writing, tell the user the path.

Don't bury the score under setup chatter — lead with the headline, then the table, then per-criterion evidence. The same content goes in the file and (optionally summarized) in your reply.

```markdown
# UI Implementation Quality Review — <app name>

**Final score: <NN>%** → **<Tier>**
- Numerator: <N>
- Denominator: <D>
- N/A count: <K> <flag low-confidence if K≥6>

## Per-criterion scores

| # | Criterion | Tier | Score | Weight | Evidence |
|---|---|---|---|---|---|
| 1 | Block Selection | Solid | 3 | 1× | 1 hand-rolled avatar at theme.css:142; UserAvatar used elsewhere |
| 2 | Block Configuration | Functional | 2 | 1× | 3 IButtons missing `btn` base class at MyScreen.oml:88, 94, 101 |
| … |
| 14 | Block-Native vs CSS Override | Hacky | 1 | 1.5× | `.user-info { width: 98% }` at theme.css:212 (popover-root trap) |

## Notable findings

- <one-line callouts of the worst hits — e.g. "OML corruption: eSpace.RegisteredRole at MyScreen.oml:55">
- <patterns of misuse worth fixing first>

## Method

- Inputs reviewed: OML (`path`), theme (`path`), spec (`path` or "not provided")
- Criteria scored mechanically: C1, C4, C5, C7, C8, C11, C14
- Criteria with human-review components: C2, C3, C6, C9, C10, C12, C13, C15, C16
```

## Calibration / batch mode

If the user asks to score multiple apps (e.g. all `output/*/` runs), repeat the per-app flow and produce a comparison table at the end:

| App | Score | Tier | Worst criterion | Best criterion |
|---|---|---|---|---|
| app-a | 42% | Hacky | C7 !important Hygiene (Broken) | C11 Auth Config (Production-ready) |
| app-b | 71% | Solid | C5 CSS Variables (Functional) | C1 Block Selection (Production-ready) |

This is the primary way to **test the rubric itself**: if scores don't track qualitative gut ranking across known-good and known-bad runs, the criteria/weights need calibration.

## What this skill does NOT do

- Does not fix the issues it finds.
- Does not run the app or render screens.
- Does not score UX / visual design — that's the separate [UI Quality Assessment](https://docs.google.com/document/d/1PQ-BdrC83y9fXXyrZrV7CWY2EC6xOH5KWp3UluWwppI/) rubric.
- Does not produce vibes-based scores — every tier mapping must cite concrete evidence (file:line, count, or quoted match).

If you can't gather evidence for a criterion from the provided inputs, mark it **N/A**. Prefer N/A over guessing.
