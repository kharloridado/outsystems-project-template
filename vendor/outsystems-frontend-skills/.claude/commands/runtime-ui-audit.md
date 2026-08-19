Audit a live runtime URL against the 16-criterion UI Quality Assessment rubric.

This command is a thin shim. The audit mechanics — capture, per-criterion scoring, weights, N/A rules, output format — live in `.claude/skills/runtime-ui-audit/SKILL.md`. Do not duplicate that content here.

## Arguments

Parse from the user's invocation (free-form, any order):

| Arg | Required? | Example |
|---|---|---|
| `URL:` | **Required** | `URL: https://myorg.outsystems.app/BankingDemo/Home` |
| `Output:` | Optional | `Output: output/banking-demo/runtime-audit.md` (defaults to `output/<slug>/runtime-audit.md`, `<slug>` from URL host+path) |
| `Max screens:` | Optional | `Max screens: 4` — how many in-app surfaces to crawl (default 4; `0` disables the crawl) |
| `Viewports:` | Optional | `Viewports: desktop` (defaults to `desktop,mobile`) |

If no `URL:` is provided, ask the user before doing anything else. Do not guess.

## What to do

1. Resolve the URL and optional args.
2. Invoke the `runtime-ui-audit` skill via the Skill tool, passing the resolved args.
3. The skill captures the landing URL (assumed public / no auth) at desktop + mobile, does a shallow in-app crawl, captures interaction states (focus ring, hover) and a mechanical probe (`probe.json`: tap-target sizes, motion/transition/focus signals), scores the 16 criteria (Market Leading→Broken, weighted) with evidence, computes the weighted % and tier, and writes the report to the resolved `Output:` path (default `output/<slug>/runtime-audit.md`). Also print the headline, the score/tier, and the per-criterion table to the conversation.
4. If a capture lands on a login page, consent wall, or error screen *instead of* the app, stop and report — auth-gated runtimes are out of scope. (A landing page that merely links to a login is fine.)
5. Do NOT modify the app or codebase. This command is read-only — same contract as the skill.

## Batch mode

If the user passes multiple URLs (e.g. `URLs: https://a/Home, https://b/Home`), run the per-URL flow for each and finish with the comparison table format defined in the skill's "Batch mode" section. Write each audit to its own `output/<slug>/runtime-audit.md` and print the comparison table to the conversation.
