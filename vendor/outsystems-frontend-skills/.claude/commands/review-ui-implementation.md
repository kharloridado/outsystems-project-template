Score an OutSystems UI implementation against the 16-criterion UI Implementation Quality Assessment rubric.

This command is a thin shim. The rubric mechanics — recipes, tier mapping, evidence rules, output format — live in `.claude/skills/review-ui-implementation/SKILL.md`. Do not duplicate that content here.

## Arguments

Parse from the user's invocation (free-form, any order):

| Arg | Required? | Example |
|---|---|---|
| `OML:` or `App:` | **Required** | `App: output/banking-demo` or `OML: output/banking-demo/MyApp.oml` |
| `Spec:` | Optional | `Spec: output/banking-demo/blueprint.json` |
| `Base OML:` | Optional | `Base OML: oml/initial.oml` |
| `Theme:` | Optional | Rarely needed — the skill extracts the theme StyleSheet from the (binary) OML via `oml query`. Only pass this if you already have the CSS as a loose file. |
| `Output:` | Optional | `Output: output/banking-demo/MyApp-judge.md` (defaults to `{oml-name}-judge.md` next to the OML) |

If only `App:` is given, resolve the OML as the single `*.oml` in that folder; resolve `Spec:` as `<app>/blueprint.json` if present. The theme is not a loose file — the skill extracts it from the OML during its prep step, so don't expect a `theme.css` on disk.

If neither `App:` nor `OML:` is provided, ask the user before doing anything else. Do not guess.

## What to do

1. Resolve the inputs above into concrete paths. Confirm the OML exists; note which optional inputs are missing (those criteria may be N/A — see the skill).
2. Invoke the `review-ui-implementation` skill via the Skill tool, passing the resolved paths as args.
3. Write the skill's report to the resolved `Output:` path (default `{oml-name}-judge.md` next to the OML, where `{oml-name}` is the OML filename without its `.oml` extension). Also print the per-criterion table + total + tier to the conversation so the user sees it without opening the file.
4. Do NOT modify the implementation. This command is read-only — same contract as the skill.

## Batch mode

If the user passes multiple apps (e.g. `Apps: output/banking-demo, output/expense-tracker` or `Apps: output/*`), run the per-app flow for each and finish with the comparison table format defined in the skill's "Calibration / batch mode" section. Write each app's report to its own `{oml-name}-judge.md` (next to that app's OML) and print the comparison table to the conversation.
