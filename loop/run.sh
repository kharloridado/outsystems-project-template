#!/usr/bin/env bash
# Bounded external loop: advances the design loop one item per call until done.
# Prereqs: claude (Claude Code), gh, jq. Run from the project root, on a branch.
#
# This drives the INVENTORY-driven loop, whose queue is loop/state.json seeded from a Figma
# audit. If this project's queue is a GitHub Project board instead (project.config.json ->
# board.owner + board.number are set), use ./loop/board-run.sh advance.
# Permissions for unattended runs come from .claude/settings.json (scoped allow-list),
# so this does NOT use --dangerously-skip-permissions.
set -euo pipefail
MAX="${1:-40}"
i=0
while [ "$i" -lt "$MAX" ]; do
  status=$(jq -r '.status' loop/state.json 2>/dev/null || echo pending)
  if [ "$status" = "done" ]; then echo "✅ Loop complete."; break; fi
  i=$((i+1))
  echo "── iteration $i/$MAX ──"
  claude -p "Follow the /outsystems-loop:design-loop skill procedure. Advance EXACTLY ONE item, persist loop/state.json (set status=done when done-criteria are met), then exit. Be concise." \
    || { echo "claude exited non-zero — stopping for inspection."; break; }
done
[ "$i" -ge "$MAX" ] && echo "⏸ Hit iteration cap ($MAX). Re-run loop/run.sh to resume."
