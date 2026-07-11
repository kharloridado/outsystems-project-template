# Loop Goal — <<DESIGN_SYSTEM_NAME>>

The run contract for `/outsystems-loop:design-loop`. Fill in every `<…>` before the first run. The orchestrator, `@outsystems-loop:maker` and `@outsystems-loop:checker` all read this file; anything not written here has not been agreed, and the loop must not assume it.

## Goal

<One sentence. e.g. "Translate the <<DESIGN_SYSTEM_NAME>> Figma library into OutSystems faithfully, tier by tier, as theme tokens + block CSS + Web Components handed over as GitHub Tasks.">

## Canonical component inventory (signed off) — REQUIRED

The loop does not build from a Figma page, a screenshot, or a conversation. It builds from a **client-confirmed component inventory**.

| Field | Value |
|---|---|
| Inventory artifact | `<the node / sheet / doc that holds the confirmed list — link or repo path>` |
| Signed off by | `<name, role — someone who can actually commit to the list>` |
| Date signed off | `<yyyy-mm-dd>` |
| Supersedes | `<previous inventory, if any>` |

**Hard rule: no component enters the build queue without a row in the signed inventory.** A component that is in Figma but not in the inventory is `needs-human`, not `queued`. A component that is in the inventory but has no Figma node is blocked on a ref (see `loop/refs/README.md`), not built from guesswork.

This section is first, and required, because of what it costs when it is missing. On the source project this template is derived from, two components were built end to end — maker + checker PASS, committed, handover Task opened — and an entire speculative component set was designed and coded, then thrown away, because no confirmed inventory existed and the client's real list turned out to be different. That is the most expensive waste this loop can produce, and refusing to start without this table prevents all of it.

## Figma

| Field | Value |
|---|---|
| Library URL | <<FIGMA_URL>> |
| **File key** | `<<FIGMA_FILE_KEY>>` |
| In scope | `<"entire library" | named pages / frames / node ids>` |
| Out of scope | `<pages deliberately excluded — state them explicitly>` |

**Track the file key, not just the URL.** Design libraries get duplicated, forked and re-versioned, and a fork carries a *different file key* while looking identical in conversation and in a screenshot. Every frozen ref records the file key it was pulled from (`loop/refs/<item-id>/spec.md`). If that key differs from the key above, **the ref is stale**: the item becomes `needs-re-ref`, and neither the maker nor the checker may trust the values it froze. On the source project a second library file appeared mid-build and silently re-versioned component values; every ref frozen against the old key quietly became wrong. Record every key change in `design/figma-links.md`.

## Mode

- `single` — one screen or a handful of components; flat queue, no tier gates.
- `library` — full design system: dependency-ordered, tier by tier, with human checkpoints.

Mode for this run: `<single | library>`.

## This run — scope

State exactly what this run does and where it stops. A run that "does everything" has no checkpoint and no reviewable output.

<e.g. "Phase 0 (foundations/tokens) only. Hard stop at the after-tokens checkpoint. No component work executes this run.">

- [ ] <scope item>
- [ ] <scope item>

## The three outcomes — every audited component gets exactly one

| Audit class | Outcome | Artifacts the loop generates |
|---|---|---|
| **Exists as-is** | Use the OutSystems UI component out of the box | None. Verify it matches the design within tolerance; if it does not, it is really the row below. |
| **Exists, not exact** | **Dual-track** | (1) *Alignment track* — L1–L3 overrides (token / utility class / `ExtendedClass` + BEM) so the stock OutSystems UI component renders close to the design for any dev who reaches for it. (2) *Canonical track* — the custom Block or Web Component (L4–L5) the team actually ships. |
| **Doesn't exist** | Build custom | Web Component (L5) + Block wrapper. Canonical. |

The dual track on "exists, not exact" is deliberate: the custom build is the team default, but a developer who grabs the stock widget should still land near the design intent rather than something visibly off-brand.

> **"Customize OutSystems UI" never means editing or forking the OutSystems UI module.** It means overrides layered on top: `:root` tokens, utility classes, `ExtendedClass` + BEM, or a wrapping Block. Upgrade-safe layers only. A change that cannot be expressed as an override is an L5 custom build, not a fork.

## Build model — two independent axes (do not conflate them)

- **Tier** = position in the dependency graph, and therefore **build order**: foundations → primitives → composites → patterns. The tier list is project-configurable — it lives in `state.json.tiers` and may grow mid-project.
- **Escalation level (L1–L5)** = implementation approach, and therefore **effort**: L1 token · L2 utility class · L3 `ExtendedClass` + BEM · L4 custom Block · L5 Web Component.

A component has exactly one tier and one level. A high tier does not imply a high level: a pattern can be a pure L1 token change, and a primitive can need a full L5 Web Component. The alignment track of an "exists, not exact" component may carry a second, lower level alongside its canonical build.

## Checkpoints (human gates)

At library scale these are the only thing standing between a bad foundation and a hundred components built on top of it.

- **After foundations/tokens → PAUSE** for designer / brand-owner sign-off. A wrong token cascades into every component downstream.
- **After primitives → PAUSE.** Highest-reuse components; lock them before composites depend on them.
- **After composites → continue.**

Mirror these in `state.json.checkpoints`. A checkpoint set to `pause` is a hard stop: the loop writes `loop/REPORT.md`, sets `status`, and exits. It does not carry on and mention it in the report.

## Done-criteria

**This run:** <restate the stopping condition for the scope above, in terms someone can check.>

**Program (full library):** every component in the signed inventory is either **built** (maker + checker PASS, committed, on the Project board, handover Task opened) or **needs-human** (logged with the blocker). All findings filed as Bugs. A consistency pass has run per tier.

## Checker gates

The deterministic gate runs first — `npm run build:theme` exits 0, the token schema resolves, contrast is computed — and a failure there is an instant FAIL before any subjective judgment. Then: fidelity against the frozen ref, token-only (no hard-coded values), BEM with the `<<CLASS_PREFIX>>` prefix, Web Component correctness, and accessibility on a flag-don't-fix basis. The full procedure lives in the `@outsystems-loop:checker` agent definition.

## Caps and guardrails

- max maker/checker rounds per item: **3**
- max global iterations: **500** (raise for very large libraries)
- branch: `loop/<yyyy-mm-dd>-design-system` *(add a phase suffix on re-runs to avoid collisions)*
- the loop **never applies changes to the live OutSystems environment** — it produces artifacts handed over as GitHub Tasks for a human to add in ODC Studio
- the loop **never resolves a finding** — flag-don't-fix; a designer or brand owner decides
- the loop **never edits or forks the OutSystems UI module** — overrides only
- the loop **never builds a component absent from the signed inventory**, and **never builds an item that has no frozen ref**
- findings are GitHub **Bugs** (Bug issue type + `bug` label); handovers are GitHub **Tasks** assigned to the developer; both in `<<OWNER/REPO>>`
- **dedup:** every issue carries `[node:<figma-node-id>]` in its body; search before creating, so a re-run never duplicates
- conventions marked `TBD` in `project.config.json` are **not rules** — the checker must not enforce them and must not raise findings against them

## Open decisions (confirm before the next tier)

1. **Dual-track scope:** every "exists, not exact" component, or only when the stock-vs-design delta exceeds a threshold?
2. **Tier taxonomy:** confirm the tier list for this project (`state.json.tiers`) before foundations complete.
3. **Branch reuse** across multiple runs on the same date.
