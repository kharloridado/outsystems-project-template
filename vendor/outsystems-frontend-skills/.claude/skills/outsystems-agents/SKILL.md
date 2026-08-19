---
name: outsystems-agents
description: Entry point for any agent doing OutSystems frontend work. Loads minimal context first and routes to the right deeper skill based on the app type (Reactive Web / Phone App vs Mobile UI Template) and task (build a screen, extend a pattern, charts, maps, cross-cutting concerns). Use this skill BEFORE loading specific catalogs or recipes — it tells you which one applies, so you only spend tokens on what's needed.
---

# OutSystems Agents — Entry Point

Token-conscious entry point for OutSystems frontend work. Decide the stack and task first; load deeper skills only when the task narrows.

**Canonical doc:** [`outsystems-agents/SKILL.md`](../../../outsystems-agents/SKILL.md)

The full content is in the canonical doc. This wrapper exists so agents that load skills from `.claude/skills/` discover this entrypoint via its description, then follow the link to the routing logic.

## Quick orientation (so a single skill load can resolve simple cases)

| App stack | Next skill to load |
|---|---|
| Reactive Web / Phone App Template | `osui-router` (canonical: `ui-frameworks/outsystems-ui/SKILL.md`) |
| Mobile UI Template | `mobile-ui-router` (canonical: `ui-frameworks/mobile-ui/SKILL.md`) |
| Cross-cutting (a11y, perf, CSS, responsive, atomic design, images) | `common-router` (canonical: `common/SKILL.md`) |
| Charts / Maps | `outsystems-charts` / `outsystems-maps` |

Don't load all the leaf skills at once. The router skills are small (~50–100 lines) and tell you which leaf applies.
