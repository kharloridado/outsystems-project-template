# Workflow

How work moves through this project. The short version: **Claude generates and hands over; the human
reviews and approves.** Nothing is treated as shipped until a human has moved it to **Approved**. This
file describes the gate, the feedback protocol, and the two GitHub output tracks.

It is generic. Fill in the customer/project values in `project.config.json`; do not restate them here.

---

## 1. The board is the tracker, `deliverables.md` is the map

Every project keeps a **`deliverables.md`** at the repo root: the canonical, human-readable list of what
this design system owes the customer, grouped by category (Foundation, Layouts, Form Control, Messaging,
Navigation, or whatever the project's own grouping is), with a status and a source path per row.

`deliverables.md` **mirrors the GitHub Project board** — one board item per deliverable. The board is the
live tracker (it carries the Status field, the comments, and the review history); `deliverables.md` is the
readable map you can hand to anyone. Keep them in sync. When they disagree, the board wins on status and
the file wins on scope.

Build order follows the categories top-down. Within each item, apply the escalation rule: **restyle the
native framework widget wherever the framework can support it, and only build a vanilla JS Web Component
when it cannot** (see `docs/LESSONS.md` §2).

---

## 2. The Status gate

Each deliverable moves left to right through the board's **Status** field. Seven states:

| Status | Meaning |
|---|---|
| **Backlog** | Not started. |
| **In Progress** | Claude is generating tokens / CSS / a Web Component. |
| **Needs Review** | Code generated and the handover is ready — **awaiting the reviewer**. Claude's work on this item is done for now. |
| **In Review** | The reviewer is actively going through the generated code. |
| **Reviewed** | The reviewer has looked at it and **left comments to implement**. See the feedback protocol below. |
| **Approved** | The reviewer has signed off. **This is what ships.** |
| **Blocked** | Waiting on something external — a missing design node, an unanswered finding, a designer decision. |

**The rule:** only **Approved** items are treated as final or shipped. Claude generates the artifact and
opens the handover; the **human** moves the item to Approved after reviewing the code. Claude never
self-approves, never moves an item to Approved, and never treats "I built it and the checker passed it"
as sign-off. A passing checker run gets an item to **Needs Review** — no further.

An item that has no design reference (no frozen snapshot of the design spec) does not get built. It goes
to **Blocked**, not to a best guess.

---

## 3. The Reviewed lane — the feedback protocol

This is the mechanism that turns review comments into code without a meeting.

1. You review an item and want changes. Move its card to **Reviewed** and leave the specifics as a
   **comment on the issue/card** — plain language is fine ("tighten the card padding", "wrong hover
   colour", "the small size is a step too large").
2. On the next run — a scheduled routine, or whenever you ask — Claude **scans the Reviewed lane**, reads
   each card's comments, implements the requested changes, and **opens a pull request**.
3. The item comes back to you. Review the PR. Either move it on to **Approved**, or send it back to
   **Reviewed** with more comments.
4. Repeat until Approved. Only Approved ships.

The comment thread on the card is the record of what was asked for and why. Do not deliver review feedback
in chat and expect it to survive; put it on the card.

If a scheduled routine drives this loop, give it its **own git worktree and branch** — a routine and an
interactive session sharing one working tree will race each other (`docs/LESSONS.md` §4.3).

---

## 4. The two GitHub output tracks

Work produces exactly two kinds of GitHub issue, and they must not be confused.

### Findings — design conflicts → **Bug** issues

A **finding** is a conflict between the design as published and the project's accessibility, brand, or
token rules: a brand colour that fails contrast, an off-palette value, a token that resolves to two
different values, a hard-coded value with no token.

The rule is **flag, don't fix**. The implementation stays faithful to the design. The finding carries the
recommendation back to the designer or brand owner, and the code changes only when they respond or sign
off. Claude never silently substitutes a colour or a value to make a check pass, and never closes a
finding on its own authority — a finding is resolved by a **human decision**, recorded.

Findings are filed as GitHub issues with the Bug type, labelled `finding` + `bug` + a type label
(`a11y` / `brand` / `token` / `consistency`) + a severity label (`sev:*`). The local register at
`findings/findings-register.md` mirrors them. Routing (repo, Slack channel, gate) lives in the `findings`
block of `project.config.json`.

The **gate** (default `high+`) means only high/blocker findings open a GitHub bug; medium and low findings
stay in the register. That is deliberate — it is what keeps the board from drowning in cosmetic
token-naming nits and stops the real problems getting lost among them.

Before a finding goes to the designer, it goes through the **designer decision document** —
`findings/DESIGNER-DECISION-TEMPLATE.md`. That template exists because a bare finding ("this fails")
produces no decision. A finding with measured options produces one.

### Handovers — generated code → **Task** issues

A **handover** is generated code — theme tokens, block CSS, a Web Component — packaged for a developer to
paste into the platform. The developer works in the platform, not in this repo, so the handover ticket
must **contain the code**, not point at a repo path. Each `handover/*.md` body carries the verbatim
artifact in a collapsed block, plus the instructions for wiring it up on the platform side.

Handovers are filed as GitHub issues with the Task type, labelled `handover` + `task`, and **assigned to
the developer** who will do the platform work.

```bash
gh issue create --title "[handover] <component> — add in OutSystems" \
  --body-file handover/<artifact>.md --label "handover,task" --type "Task" \
  --assignee <dev> --repo <owner/repo>
```

Both tracks can live on the same GitHub Project board — a kanban with the Status column above, which you
drag items across.

---

## 5. Where the loop fits

The autonomous design loop (`/outsystems-loop:design-loop`, with the `@outsystems-loop:maker` and
`@outsystems-loop:checker` agents) drives the **In Progress → Needs Review** segment of the gate and
nothing beyond it:

1. The orchestrator freezes a **design reference snapshot** for the item before any build. Subagents have
   no design-tool access, so the frozen snapshot is the spec of record; both the maker and the checker
   judge against it, never against live design. **No reference, no build** — the item goes Blocked.
2. **`@maker`** builds exactly one artifact, faithfully.
3. **`@checker`** independently validates it — deterministic build gate first (the build must exit 0), then
   fidelity, token-only usage, BEM, Web Component correctness, and accessibility on a flag-don't-fix basis.
   It returns PASS or FAIL. It never edits files.
4. On PASS: commit, open the handover Task, update the Style Guide, and move the board item to **Needs
   Review**.

Everything downstream of Needs Review is human. That is the point of the gate.
