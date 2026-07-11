#!/usr/bin/env bash
# Create the GitHub Project (kanban board) that the design-system loop fills with deliverables.
# Run once per project. Requires the 'project' auth scope:  gh auth refresh -s project
# Usage: ./.github/setup-project.sh <owner> <owner/repo> "Design System v1"
set -euo pipefail
OWNER="${1:?usage: setup-project.sh <owner> <owner/repo> <title>}"
REPO="${2:?owner/repo required}"
TITLE="${3:-Design System v1}"

# Verify the project scope is present
if ! gh auth status 2>&1 | grep -q "project"; then
  echo "Your gh token lacks the 'project' scope. Run:  gh auth refresh -s project" >&2
  exit 1
fi

echo "Creating project '$TITLE' for $OWNER ..."
NUM=$(gh project create --owner "$OWNER" --title "$TITLE" --format json | python3 -c 'import sys,json;print(json.load(sys.stdin)["number"])')
echo "Project number: $NUM"

gh project link "$NUM" --owner "$OWNER" --repo "$REPO" || true

# ---------------------------------------------------------------------------
# Status — the review gate the whole workflow depends on (see WORKFLOW.md).
#
# GitHub creates a default Status field with Todo / In Progress / Done. That is NOT
# the gate this workflow documents, and the previous version of this script left the
# default in place — so every project started with a board that could not express
# "Needs Review" or "Approved", the two states the process actually turns on.
#
# gh cannot yet edit an existing field's options, so we delete the default Status and
# recreate it with the real lanes. The load-bearing one is Approved: ONLY Approved
# items ship, and only a human moves a card there.
# ---------------------------------------------------------------------------
STATUS_ID=$(gh project field-list "$NUM" --owner "$OWNER" --format json \
  | python3 -c 'import sys,json;print(next((f["id"] for f in json.load(sys.stdin)["fields"] if f["name"]=="Status"), ""))')

if [ -n "$STATUS_ID" ]; then
  echo "Replacing the default Status field with the review gate ..."
  gh project field-delete --id "$STATUS_ID" >/dev/null 2>&1 || \
    echo "  (could not delete the default Status field — set its options by hand, see WORKFLOW.md)"
fi

gh project field-create "$NUM" --owner "$OWNER" --name "Status" --data-type SINGLE_SELECT \
  --single-select-options "Backlog,In Progress,Needs Review,In Review,Reviewed,Approved,Blocked" \
  || echo "  (Status already exists — check its options match WORKFLOW.md)"

gh project field-create "$NUM" --owner "$OWNER" --name "Tier"      --data-type SINGLE_SELECT --single-select-options "Foundations,Primitives,Composites,Patterns"
gh project field-create "$NUM" --owner "$OWNER" --name "Level"     --data-type SINGLE_SELECT --single-select-options "L1,L2,L3,L4,L5"
gh project field-create "$NUM" --owner "$OWNER" --name "Type"      --data-type SINGLE_SELECT --single-select-options "Component,Finding,Handover"
gh project field-create "$NUM" --owner "$OWNER" --name "Severity"  --data-type SINGLE_SELECT --single-select-options "blocker,high,medium,low"
gh project field-create "$NUM" --owner "$OWNER" --name "FigmaNode" --data-type TEXT

echo "Done. Project #$NUM created and linked to $REPO."
echo "Record it in loop/state.json -> project.number = $NUM, project.owner = $OWNER"
echo "Tip: in the Project UI add a Board view grouped by Status (kanban) and a Table view grouped by Tier."
echo "Reminder: only 'Approved' ships, and only you move a card there. See WORKFLOW.md."
