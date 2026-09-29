# Design decisions — rulings and signed-off exceptions

The loop reads this file. A decision recorded here is respected; one that lives only in a meeting
note or a thread gets re-flagged on every run. One row per decision, citing the finding or issue it
settles, who signed it off and when — an exception with no owner and no date is indistinguishable
from an oversight. The machine-readable sibling is `knownFalsePositiveClasses` in
`project.config.json`: finding classes refuted for good.

## Signed-off exceptions

Approved deviations from the rules: accessibility conflicts the brand owner accepted, deliberate
off-palette values, values the designer confirmed are correct as drawn.

| Exception | Applies to | Rationale | Signed off by | Date | Finding / issue |
| --- | --- | --- | --- | --- | --- |

## Rulings

Findings a human ruled on (`resolved` / `resolved (code changed)` in the register).

| Finding | Ruling | Date | Issue |
|---|---|---|---|
