#!/usr/bin/env bash
# Bring an EXISTING GitHub Project board up to the board-driven spec (WORKFLOW.md):
# the 8-lane Status gate, plus the custom fields the loop reads.
#
# Use this when the board already exists — including a stock board created in the GitHub UI,
# which has the default Todo / In Progress / Done Status and none of the custom fields.
# setup-project.sh creates a new board and then calls this script to shape it.
#
# ---------------------------------------------------------------------------------------
# HOW THE STATUS LANES ARE CHANGED, AND WHY NOT THE OBVIOUS WAY
#
# `gh project field-create` cannot edit an existing field's options, so the obvious move is
# to delete Status and recreate it. That does not work and never did:
#
#     GraphQL: Only custom fields can be deleted. (deleteProjectV2Field)
#
# Status is a BUILT-IN field. An earlier version of this workflow tried exactly that, logged
# the failure to stderr and carried on — so every board it "set up" silently kept GitHub's
# default Todo/In Progress/Done and could not express the gate the workflow is built on.
#
# The right API is the GraphQL `updateProjectV2Field` mutation, which takes a full
# singleSelectOptions list. Each option may carry an `id`:
#   - pass an existing id  -> that option is UPDATED IN PLACE (it can even be renamed), and
#                             every item already sitting in it keeps its value
#   - omit the id          -> a new option is created
#   - leave an id out of the list entirely -> that option is removed, and items in it lose
#                             their lane, which is the only case needing a save-and-restore
#
# So the migration renames what it can (Todo -> Backlog carries its items across for free)
# and only snapshots + re-applies the items whose old lane has no id to inherit.
# ---------------------------------------------------------------------------------------
#
# Usage:
#   ./.github/migrate-project-status.sh <owner> <project-number> [--confirm]
#
# Requires: gh with the `project` scope (gh auth refresh -s project), and jq.

set -euo pipefail

OWNER="${1:?usage: migrate-project-status.sh <owner> <project-number> [--confirm]}"
NUM="${2:?project number required (the <number> in .../projects/<number>)}"
CONFIRM="${3:-}"

# The gate, in board order. Keep this list and status-map.md in the plugin in step.
read -r -d '' TARGET_LANES <<'JSON' || true
[
  {"name":"Backlog",          "color":"GRAY",   "description":"Not started. No requirement attached yet."},
  {"name":"Ready",            "color":"BLUE",   "description":"Has a Figma node or a written spec. The loop may build it."},
  {"name":"In Progress",      "color":"YELLOW", "description":"Claimed by board-advance. Do not edit the card."},
  {"name":"Ready for Review", "color":"ORANGE", "description":"Checker passed. Awaiting your review."},
  {"name":"Approved",         "color":"GREEN",  "description":"Your sign-off. This is what ships. Only you move a card here."},
  {"name":"Handover",         "color":"PURPLE", "description":"Merged to main, handover Task opened. Yours to build in ODC."},
  {"name":"Done",             "color":"PINK",   "description":"OutSystems work finished."},
  {"name":"Blocked",          "color":"RED",    "description":"Needs a human: missing ref, wrong library, or an open finding."}
]
JSON

# Old lane -> new lane. Identity where the lane survives. The two interesting cases:
#
#   Todo -> Backlog
#     GitHub's default, present on any board not created by setup-project.sh.
#
#   Reviewed -> Ready
#     "Reviewed" used to mean "the reviewer left comments to implement". In the new gate that
#     is expressed by moving a card back to Ready with comments on it — which board-advance
#     actually reads and rebuilds from. This mapping is what turns a documented-but-dead
#     protocol (WORKFLOW.md §3) into a live one.
map_lane() {
  case "$1" in
    Backlog|Ready|"In Progress"|"Ready for Review"|Approved|Handover|Done|Blocked) echo "$1" ;;
    Todo)            echo "Backlog" ;;
    "Needs Review")  echo "Ready for Review" ;;
    "In Review")     echo "Ready for Review" ;;
    Reviewed)        echo "Ready" ;;
    *)               echo "Backlog" ;;   # unknown lane — park it, never guess forward
  esac
}

# ---- preflight -------------------------------------------------------------
command -v jq >/dev/null || { echo "jq is required. brew install jq" >&2; exit 1; }
if ! gh auth status 2>&1 | grep -q "project"; then
  echo "Your gh token lacks the 'project' scope. Run:  gh auth refresh -s project" >&2
  exit 1
fi

PROJECT_ID=$(gh project view "$NUM" --owner "$OWNER" --format json --jq '.id')
[ -n "$PROJECT_ID" ] || { echo "Could not resolve project #$NUM for $OWNER." >&2; exit 1; }

FIELDS=$(gh project field-list "$NUM" --owner "$OWNER" --format json --limit 50)
STATUS_ID=$(jq -r '.fields[] | select(.name == "Status") | .id' <<<"$FIELDS")
[ -n "$STATUS_ID" ] || { echo "This project has no Status field." >&2; exit 1; }

OLD_OPTS=$(jq -c '[.fields[] | select(.name == "Status") | .options[]? | {id, name}]' <<<"$FIELDS")

# ---- plan ------------------------------------------------------------------
# For each target lane, claim at most one old option to inherit (prefer an exact name match,
# else the first old option that maps to this lane). Everything unclaimed is dropped.
# jq cannot call map_lane, so resolve each old option's target lane in bash first.
# base64 round-tripping because lane names contain spaces.
MAPPED=$(jq -r '.[] | @base64' <<<"$OLD_OPTS" | while read -r b64; do
    entry=$(printf '%s' "$b64" | base64 --decode)
    nm=$(jq -r '.name' <<<"$entry")
    jq -c --arg m "$(map_lane "$nm")" '. + {mapped: $m}' <<<"$entry"
  done | jq -sc '.')

PLAN=$(jq -n --argjson target "$TARGET_LANES" --argjson old "$MAPPED" '
  reduce $target[] as $t ({claimed: [], opts: []};
    . as $acc
    | ($old | map(select(.id as $i | ($acc.claimed | index($i)) | not))) as $free
    | ( ($free | map(select(.name == $t.name)) | first)
        // ($free | map(select(.mapped == $t.name)) | first) ) as $inherit
    | .claimed += (if $inherit then [$inherit.id] else [] end)
    | .opts += [ if $inherit
                 then {id: $inherit.id, name: $t.name, color: $t.color, description: $t.description}
                 else {name: $t.name, color: $t.color, description: $t.description} end ]
  )
')
NEW_OPTS=$(jq -c '.opts' <<<"$PLAN")
CLAIMED=$(jq -c '.claimed' <<<"$PLAN")
DROPPED=$(jq -c --argjson c "$CLAIMED" '[.[] | select((.id | IN($c[])) | not)]' <<<"$MAPPED")

echo "Board #$NUM ($OWNER)"
echo
echo "Status lanes:"
jq -r --argjson old "$MAPPED" '
  ($old | map({key: .id, value: .name}) | from_entries) as $byid
  | .[] | if .id
      then "  ~ \($byid[.id] // "?") -> \(.name)   (in place — items keep their lane)"
      else "  + \(.name)   (new)" end' <<<"$NEW_OPTS"

DROPPED_COUNT=$(jq 'length' <<<"$DROPPED")
if [ "$DROPPED_COUNT" -gt 0 ]; then
  echo
  echo "Lanes with no id to inherit — items in them are re-applied after the update:"
  jq -r '.[] | "  - \(.name) -> \(.mapped)"' <<<"$DROPPED"
fi

# Snapshot only the items sitting in a dropped lane; everything else survives untouched.
ITEMS=$(gh project item-list "$NUM" --owner "$OWNER" --format json --limit 1000)
COUNT=$(jq '.items | length' <<<"$ITEMS")
AT_RISK=$(jq -c --argjson d "$DROPPED" '[.items[] | select((.status // "") as $s | $d | any(.name == $s)) | {id, title, status}]' <<<"$ITEMS")
AT_RISK_COUNT=$(jq 'length' <<<"$AT_RISK")

echo
echo "$COUNT item(s) on the board; $AT_RISK_COUNT need re-applying."
if [ "$AT_RISK_COUNT" -gt 0 ]; then
  BACKUP="$(mktemp -t "board-${NUM}-at-risk").json"
  jq -n --argjson a "$AT_RISK" --argjson d "$DROPPED" '{at_risk: $a, dropped: $d}' > "$BACKUP"
  echo "Backup: $BACKUP"
  jq -r '.[] | "  \(.title)  [\(.status)]"' <<<"$AT_RISK"
fi

echo
if [ "$CONFIRM" != "--confirm" ]; then
  echo "Dry run — nothing changed. Re-run with --confirm to apply:"
  echo "    ./.github/migrate-project-status.sh $OWNER $NUM --confirm"
  exit 0
fi

# ---- apply: rewrite the Status options in place ----------------------------
echo "Updating the Status field in place ..."
jq -n --arg fid "$STATUS_ID" --argjson opts "$NEW_OPTS" '{
  query: "mutation($fieldId:ID!,$opts:[ProjectV2SingleSelectFieldOptionInput!]){ updateProjectV2Field(input:{fieldId:$fieldId, singleSelectOptions:$opts}){ projectV2Field { ... on ProjectV2SingleSelectField { id name options { id name } } } } }",
  variables: {fieldId: $fid, opts: $opts}
}' | gh api graphql --input - --jq '.data.updateProjectV2Field.projectV2Field.options[] | "  \(.name)"'

# ---- re-apply the lanes that could not be inherited ------------------------
if [ "$AT_RISK_COUNT" -gt 0 ]; then
  echo "Re-applying $AT_RISK_COUNT item lane(s) ..."
  FIELDS=$(gh project field-list "$NUM" --owner "$OWNER" --format json --limit 50)
  opt_id() { jq -r --arg n "$1" '.fields[]|select(.name=="Status")|.options[]?|select(.name==$n)|.id' <<<"$FIELDS"; }
  while read -r b64; do
    entry=$(printf '%s' "$b64" | base64 --decode)
    iid=$(jq -r '.id' <<<"$entry"); old=$(jq -r '.status' <<<"$entry"); ttl=$(jq -r '.title' <<<"$entry")
    new=$(map_lane "$old"); oid=$(opt_id "$new")
    if [ -z "$oid" ]; then echo "  ! no option id for '$new' — skipping $ttl" >&2; continue; fi
    gh project item-edit --id "$iid" --project-id "$PROJECT_ID" --field-id "$STATUS_ID" \
      --single-select-option-id "$oid" >/dev/null
    echo "  $ttl: $old -> $new"
  done < <(jq -r '.[] | @base64' <<<"$AT_RISK")
fi

# ---- the custom fields the loop reads --------------------------------------
# Idempotent. Keep every name a SINGLE PascalCase word: `gh project item-list --format json`
# surfaces custom fields as top-level keys with only the first character lowered, so
# "Figma Node" would key as "figma Node" and break every jq expression reading it.
echo
echo "Ensuring the custom fields exist ..."
FIELDS=$(gh project field-list "$NUM" --owner "$OWNER" --format json --limit 50)
ensure_field() { # name, data-type, [single-select options]
  if jq -e --arg n "$1" '.fields[] | select(.name == $n)' >/dev/null <<<"$FIELDS"; then
    echo "  = $1 (already present)"
  elif [ -n "${3:-}" ]; then
    if gh project field-create "$NUM" --owner "$OWNER" --name "$1" --data-type "$2" --single-select-options "$3" >/dev/null 2>&1
    then echo "  + $1"; else echo "  ! could not create $1 — create it by hand" >&2; fi
  else
    if gh project field-create "$NUM" --owner "$OWNER" --name "$1" --data-type "$2" >/dev/null 2>&1
    then echo "  + $1"; else echo "  ! could not create $1 — create it by hand" >&2; fi
  fi
}
ensure_field "Tier"      SINGLE_SELECT "Foundations,Primitives,Composites,Patterns"
ensure_field "Level"     SINGLE_SELECT "L1,L2,L3,L4,L5"
ensure_field "Type"      SINGLE_SELECT "Component,Finding,Handover"
ensure_field "Severity"  SINGLE_SELECT "blocker,high,medium,low"
ensure_field "FigmaNode" TEXT
ensure_field "Branch"    TEXT
ensure_field "Runner"    TEXT

echo
echo "Done. Board #$NUM is on the 8-lane gate."
echo
echo "Next: record the board in project.config.json (NOT loop/state.json, which is a cache):"
echo "    npm run init      # paste https://github.com/users/$OWNER/projects/$NUM when asked"
