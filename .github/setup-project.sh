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
NUM=$(gh project create --owner "$OWNER" --title "$TITLE" --format json --jq '.number')
echo "Project number: $NUM"

gh project link "$NUM" --owner "$OWNER" --repo "$REPO" || true

# ---------------------------------------------------------------------------
# Status — the review gate the whole workflow depends on (see WORKFLOW.md).
#
# GitHub creates a default Status field with Todo / In Progress / Done. That is NOT
# the gate this workflow documents, and the previous version of this script left the
# default in place — so every project started with a board that could not express
# "Ready" or "Approved", the two lanes the whole process turns on.
#
# `gh` cannot edit a field's options, and the obvious workaround — delete Status and
# recreate it — DOES NOT WORK, because Status is a built-in field:
#
#     GraphQL: Only custom fields can be deleted. (deleteProjectV2Field)
#
# The earlier version of this script did exactly that, swallowed the error and carried on,
# so every board it "set up" silently kept Todo/In Progress/Done. The working API is the
# GraphQL `updateProjectV2Field` mutation, which rewrites the options in place — and that
# lives in migrate-project-status.sh, which this script now calls rather than duplicating.
#
# The lanes, and who may move a card into each:
#   Backlog          you      — a deliverable exists, no requirement attached yet
#   Ready            you      — it carries a Figma node or a written spec; the loop may start
#   In Progress      the loop — board-advance's claim; also the crash lock
#   Ready for Review the loop — checker PASSed; awaiting your review
#   Approved         YOU ONLY — your sign-off. This is what ships.
#   Handover         the loop — board-ship merged it to main and opened the handover Task
#   Done             you      — you finished the OutSystems work
#   Blocked          either   — no design ref, wrong Figma library, or an open blocking finding
#
# The load-bearing rule: no agent ever moves a card into Approved or Done.
# ---------------------------------------------------------------------------
"$(dirname "$0")/migrate-project-status.sh" "$OWNER" "$NUM" --confirm

echo
echo "Done. Project #$NUM created and linked to $REPO."
echo
echo "Next — record the board in project.config.json (NOT in loop/state.json, which is a cache):"
echo "    npm run init      # paste https://github.com/users/$OWNER/projects/$NUM when asked"
echo
echo "Tip: in the Project UI add a Board view grouped by Status (kanban) and a Table view grouped by Tier."
echo "Reminder: only 'Approved' ships, and only you move a card there. See WORKFLOW.md."
