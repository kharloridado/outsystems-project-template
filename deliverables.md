<!-- GENERATED FILE — do not edit by hand.
     Written by /outsystems-loop:board-sync from the GitHub Project board.
     Edit the board; re-run `npm run board:sync` to regenerate this file.
     Board: (not configured — set project.config.json → board.url) -->

# Deliverables

The human-readable map of what this design system owes the customer, generated from the
GitHub Project board.

**The board is the live tracker** — it carries the Status lane, the comments and the review
history. This file is the readable, diffable, client-showable snapshot of it. When the two
disagree, the board wins on status and this file wins on scope.

For a project whose `Inventory source` is `board` (see `loop/goal.md`), this file is also the
inventory of record: the artifact a scope owner counter-signs, standing in for a signed
component-inventory table.

---

_No deliverables yet._

Set up the board, then generate this file:

```bash
gh auth refresh -s project        # one-time scope
./.github/setup-project.sh <owner> <owner/repo> "Design System v1"
npm run init                      # paste the board URL when asked
npm run board:sync
```

Then file deliverables from `.github/ISSUE_TEMPLATE/deliverable.yml`, drop them in **Backlog**,
and move one to **Ready** when it carries a Figma node or a written spec.
