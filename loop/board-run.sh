#!/usr/bin/env bash
# Bounded runner for the board-driven design loop. One stage per invocation, cron-able.
#
#   ./loop/board-run.sh advance [--max N] [--dry-run]   # Ready -> build -> Ready for Review
#   ./loop/board-run.sh ship    [--max N] [--dry-run]   # Approved -> PR -> main -> Handover
#   ./loop/board-run.sh sync    [--reclaim-stale] [--dry-run]
#
# Prereqs: claude (Claude Code), gh with the `project` scope, jq.
# Permissions for unattended runs come from .claude/settings.json (a scoped allow-list),
# so this does NOT use --dangerously-skip-permissions.
#
# WHY A DISPATCHER SCRIPT RATHER THAN A DISPATCHER SKILL:
#   the three stages need different environments. `advance` needs the Figma MCP and a browser
#   (the checker's rendered-fidelity gate); `ship` needs neither, which is exactly why it is
#   the one stage that is safe to schedule in the cloud. Separate crontab lines with separate
#   locks are clearer and safer than one entry point that decides for itself.

set -euo pipefail
cd "$(dirname "$0")/.."

STAGE="${1:-}"
shift || true
case "$STAGE" in
  advance|ship|sync) ;;
  *) echo "usage: ./loop/board-run.sh {advance|ship|sync} [--max N] [--dry-run] [--reclaim-stale]" >&2; exit 2 ;;
esac

MAX=1
PASSTHRU=()
while [ $# -gt 0 ]; do
  case "$1" in
    --max) MAX="${2:?--max needs a number}"; shift 2 ;;
    --max=*) MAX="${1#*=}"; shift ;;
    --dry-run|--reclaim-stale) PASSTHRU+=("$1"); shift ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done
[ "$STAGE" = "sync" ] && MAX=1   # sync is a single sweep, never a loop

LOG="loop/board.log"
say() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "$LOG"; }

# ---- preflight --------------------------------------------------------------
command -v jq     >/dev/null || { echo "jq is required. brew install jq" >&2; exit 1; }
command -v claude >/dev/null || { echo "claude (Claude Code) is required." >&2; exit 1; }

if ! gh auth status 2>&1 | grep -q "project"; then
  echo "Your gh token lacks the 'project' scope. Run:  gh auth refresh -s project" >&2
  exit 1
fi

BOARD_OWNER=$(jq -r '.board.owner // empty' project.config.json)
BOARD_NUMBER=$(jq -r '.board.number // empty' project.config.json)
if [ -z "$BOARD_OWNER" ] || [ -z "$BOARD_NUMBER" ]; then
  echo "Board mode is off: project.config.json -> board.owner / board.number are not set." >&2
  echo "Run \`npm run init\` and give it the board URL, or use ./loop/run.sh instead." >&2
  exit 1
fi

# A dirty tree means a routine could sweep an interactive session's work into a commit.
# LESSONS.md §4.3 — this happened, once, and cost real work.
if [ -n "$(git status --porcelain)" ]; then
  say "⚠ working tree is dirty — refusing to run so a routine cannot commit your work."
  git status --short >&2
  exit 1
fi

# ---- one lock per stage -----------------------------------------------------
# macOS has no flock(1); mkdir is the portable atomic primitive. Separate lock per stage so
# advance and ship never block each other. Contention exits 0, not non-zero: overlapping
# cron runs are expected, not an error, and a non-zero exit would page someone.
LOCK="loop/.board-${STAGE}.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  say "another board-$STAGE run holds $LOCK (pid $(cat "$LOCK/pid" 2>/dev/null || echo '?'), started $(cat "$LOCK/started_at" 2>/dev/null || echo '?')) — exiting."
  exit 0
fi
# Release explicitly, file by file: `rmdir` alone cannot remove a directory that still holds
# started_at and pid, so a bare `rmdir ... || true` fails silently and strands the lock — after
# which every later run reports contention and exits, and the runner never runs again.
# Named paths rather than `rm -rf "$LOCK"`: no recursion, no glob, nothing to get wrong if $LOCK
# is ever empty or unset.
release_lock() { rm -f "$LOCK/started_at" "$LOCK/pid"; rmdir "$LOCK" 2>/dev/null || true; }
trap release_lock EXIT
date -u +%FT%TZ > "$LOCK/started_at"
echo $$ > "$LOCK/pid"

# ---- run --------------------------------------------------------------------
FLAGS="${PASSTHRU[*]:-}"
say "board-$STAGE on project #$BOARD_NUMBER ($BOARD_OWNER)${FLAGS:+ [$FLAGS]} — up to $MAX iteration(s)"

i=0
while [ "$i" -lt "$MAX" ]; do
  i=$((i + 1))
  say "── $STAGE iteration $i/$MAX ──"

  if ! claude -p "Follow the /outsystems-loop:board-${STAGE} skill procedure. ${FLAGS}
Advance EXACTLY ONE card (or, for sync, do exactly one reconciliation sweep), persist state, then exit.
If there is nothing to do, say so in one line and exit — do not go looking for other work. Be concise." \
      2>&1 | tee -a "$LOG"; then
    say "claude exited non-zero — stopping for inspection."
    exit 1
  fi
done

[ "$i" -ge "$MAX" ] && [ "$STAGE" != "sync" ] && say "done ($i iteration(s)). Re-run to continue."
exit 0
