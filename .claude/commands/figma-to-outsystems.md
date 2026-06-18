---
name: figma-to-outsystems
description: Orchestrate the end-to-end workflow of translating Figma Hi-Fi mockups into OutSystems Reactive Web or ODC implementations with full automation — including direct Figma MCP integration, fidelity-first WCAG 2.2 AA validation, design-conformance findings (accessibility/brand/token) routed to tickets and Slack, project context awareness, Web Component generation, and Git-ready commit artifacts. Use this skill whenever the user mentions a Figma handoff, design analysis, design tokens, OutSystems UI customization, BEM CSS, Web Components, Style Guide, brand conformance, accessibility findings, or anything about translating design to OutSystems code.
---

# Figma → OutSystems Workflow Orchestrator (v4)

This is the master orchestrator. It coordinates all sub-skills based on what the user needs.

**Governing principle (v4):** build the design faithfully. Never silently change brand colors, values, or tokens to satisfy accessibility or tidy a design. Where the design conflicts with accessibility, brand, or token rules, implement to spec and raise a tracked **finding** (ticket + Slack) via `outsystems-design-findings`. Implementation-level accessibility that doesn't alter the design (focus rings in the design's colors, keyboard, ARIA, semantic HTML, reduced-motion, labels) is still applied automatically.

## Pre-flight checks (run in order)

Before any task, verify and gather context:

### 1. Global conventions (account-level)
Check `memory_user_edits` for entries starting with `OutSystems convention:`. If missing → invoke `outsystems-onboarding` skill.

Required conventions:
- `prefix` (e.g., `acme-`)
- `environment` (O11 / ODC / Both)
- `spacing base` (4pt / 8pt)
- `token style` (OutSystems UI standard / custom)

### 2. Project context (per-project)
Check `memory_user_edits` for entries starting with `OutSystems project:`. If missing → invoke `outsystems-project-context` skill.

Required project context:
- `customer` (e.g., "Acme Corp")
- `name` (project name)

### 3. Accessibility mode
Default is **fidelity-first WCAG 2.2 AA**: apply implementation-level a11y automatically; flag (don't fix) anything that would alter a design-specified value. The `outsystems-accessibility` skill is always active.

### 4. Findings routing config (per-project)
Check the project's `CLAUDE.md` / `project-context.md` (or memory `OutSystems project: findings routing = ...`) for:
- `findings.ticketing` (github [default] / notion / jira) + `findings.ticket_target`
- `findings.slack_channel`
- `findings.gate` (high+ / all)

If missing, ask once (via `outsystems-design-findings`) and store. Default is **GitHub Issues** — created via `gh` in Claude Code, works on the private repo with no MCP. Notion/Jira are supported alternatives.

## The user's context

- **Role:** OutSystems Expert Developer, Frontend specialist
- **Platforms:** Reactive Web + ODC (never Traditional Web)
- **Maintains:** Live Style Guide + Design System inside OutSystems
- **Input:** Figma Hi-Fi mockups from UI Designer (now via Figma MCP, not just screenshots)
- **CSS methodology:** BEM (Block__Element--Modifier)
- **Custom components:** Vanilla JS Web Components wrapped in OutSystems Blocks
- **Accessibility:** WCAG 2.2 AA, fidelity-first (flag-don't-fix on design conflicts)
- **Findings:** brand/token/a11y conflicts logged + routed to tickets + Slack, never silently fixed
- **Workflow:** Hybrid — Claude.ai for design/gen, Claude Code for Git

## The 7-phase workflow (v4)

### Phase 1: Design Audit
**Trigger:** User shares Figma URL or screenshot.

**Routing:**
- Figma URL → invoke `outsystems-figma-integration` first to pull data via MCP, then route to `outsystems-component-audit` for classification
- Screenshot only → invoke `outsystems-component-audit` directly (vision-based)

**Output:**
- Component inventory: ✅ As-is / 🎨 Customize / 🆕 Web Component
- Brand consistency findings
- Token deltas
- **Accessibility findings** (from `outsystems-accessibility` running alongside — flagged, not fixed)
- Implementation plan with escalation levels
- A consolidated **Findings Register** (audit section 5)

### Phase 1.5: Findings & Routing (NEW in v4)
**Trigger:** Audit produced findings; or user says "log these" / "open tickets" / "send to Slack".

**Routing:** Invoke `outsystems-design-findings`. It writes `findings/findings-register.md`, generates ticket payloads in `findings/tickets/`, and routes `high+` findings to the configured tracker — by default **GitHub Issues** via `gh` (run in Claude Code; works on the private repo), or Notion/Jira if the project uses those. Slack notifications come from GitHub's Slack app or the Slack connector. **The implementation always proceeds faithfully regardless — findings never block the build.**

### Phase 2: Token Pipeline
**Trigger:** Token updates needed.

**Routing:**
- Figma data already pulled → use it
- Fresh Figma URL → invoke `outsystems-figma-integration` first
- Manual values → invoke `outsystems-token-extractor` directly

**Always:** `outsystems-accessibility` calculates contrast at generation time and raises findings on failures — tokens are built as designed, never silently re-shaded.

### Phase 3: Component Build (escalation ladder)

| Level | Approach | Effort | Skill |
|---|---|---|---|
| **L1** | Token change in `:root` | 1 min | `outsystems-token-extractor` |
| **L2** | OutSystems UI utility class | 30 sec | (no skill needed) |
| **L3** | `ExtendedClass` + BEM modifier | 5-15 min | `outsystems-bem-css` |
| **L4** | Wrap pattern in custom Block | 30-60 min | `outsystems-bem-css` |
| **L5** | **Web Component + Block wrapper** | 1-4 hrs | `outsystems-web-component` |

**Always:** `outsystems-accessibility` runs alongside. It auto-applies focus indicators (in the design's colors), touch targets where layout allows, ARIA, and keyboard handlers; and it flags (does not fix) any contrast/size conflict that would alter the design — those go back through Phase 1.5.

### Phase 4: Style Guide Update
Invoke `outsystems-style-guide-doc`. Generated page **must** include the Accessibility Report section and link any open findings for the component.

### Phase 5: Validate & Iterate
- Never validate in Service Studio Preview
- 1-Click Publish (F5) → real browser (F6)
- Test at all breakpoints (phone, tablet, desktop)
- For Web Components: browser only

### Phase 6: Git & Handover
**Trigger:** Code has been generated; user says "ready to commit" / "make a PR" / "hand this over".

**Two parts:**
1. **Git artifacts** — invoke `outsystems-git-helpers` for commit message, branch name, PR description. User commits via Claude Code or terminal.
2. **Handover to OutSystems (default for ANY generated code).** Because the user works mainly inside OutSystems, generated code (CSS files, Web Component `.js`, Block-wrapper instructions) is not the final output of the chat — it is handed over as a **GitHub issue filed as the Task type, assigned to the user**, so they can add it into OutSystems. Created via `gh` in Claude Code:
   ```bash
   gh issue create \
     --title "[handover] rnt-segmented — add Web Component + Block in OutSystems" \
     --body-file handover/<artifact>.md \
     --label "handover,task" \
     --type "Task" \
     --assignee @me \
     --repo <owner/repo>
   ```
   The issue body lists every generated file, where each goes in OutSystems (Theme CSS / Script resource / Block), and a checklist. `@me` resolves to the user running `gh`; set `handover.assignee` in project config to assign explicitly. The handover task can be added to the same Project board as findings so everything sits in one kanban view.

## Hard rules (never break)

1. Never edit the OutSystems UI module directly
2. Never validate in Service Studio Preview alone
3. Never hard-code design values — always `var(--token)`
4. Never use `!important` except third-party widget overrides (with comment)
5. Never style `[data-*]` attributes
6. Never couple state classes (`.block.is-open`) — use modifiers (`--is-open`)
7. Never use generic class names without stored prefix
8. Never attach custom classes by mutating OutSystems UI's internal classes — use `ExtendedClass`
9. Never trust Service Studio Preview
10. Never recommend forking OutSystems UI
11. For custom components: vanilla JS Web Components only, no Lit/Stencil/React
12. **Never silently substitute a brand color, value, or token to satisfy accessibility** — build to spec and raise a finding. Auto-apply only implementation-level a11y that doesn't change the design.
13. **Never drop a finding to avoid friction** — log it (register at minimum), even if low severity. Findings never block the build.
14. **Findings are filed as GitHub Bugs** (Bug issue type + `bug` label).
15. **Generated code is handed over as a GitHub Task assigned to the user** (not just pasted in chat) so they can add it into OutSystems.

## Routing rules

| User intent | Skills to invoke (in order) |
|---|---|
| Shares a Figma URL | `outsystems-figma-integration` → `outsystems-component-audit` → `outsystems-design-findings` |
| Shares a screenshot | `outsystems-component-audit` → `outsystems-design-findings` |
| "Generate :root for..." | `outsystems-token-extractor` (+ `outsystems-accessibility` calculates contrast → findings) |
| "Customize the [pattern]" | `outsystems-bem-css` (+ `outsystems-accessibility`) |
| "Build a [custom thing]" | `outsystems-web-component` (+ `outsystems-accessibility`) |
| "Log these / open tickets / send to Slack" | `outsystems-design-findings` (findings filed as Bug) |
| "Hand this over" / after any code generation | Phase 6 — `outsystems-git-helpers` + GitHub Task assigned to user |
| "Document this for the Style Guide" | `outsystems-style-guide-doc` (with a11y section + linked findings) |
| "Ready to commit" / "Make a PR" | `outsystems-git-helpers` |
| "Should I customize or build new?" | Apply escalation ladder |

## Response defaults

### When user shares a Figma URL
1. Pre-flight (memory + findings-routing config checks)
2. `outsystems-figma-integration` pulls data via MCP
3. `outsystems-component-audit` classifies
4. `outsystems-accessibility` calculates contrast + raises a11y findings (does not alter colors)
5. `outsystems-design-findings` writes the register + routes `high+` (Phase 1.5)
6. Present Phase 1 audit + Findings Register + offer next steps

### When user shares a screenshot
Same as above but skip Figma MCP step.

### When user asks for a custom component
1. Pre-flight
2. Confirm L5 (no OS UI pattern fits)
3. `outsystems-web-component` generates the JS file + Block wrapper
4. `outsystems-accessibility` ensures keyboard, ARIA, target sizes; flags any design-level conflict
5. Phase 6 — `outsystems-git-helpers` artifacts + open a **handover Task assigned to the user** with the files and OutSystems install steps

### When user says "everything" or "do it all"
After Phase 1 audit, proceed without further questions:
1. Route findings (Phase 1.5) — register + GitHub Bug issues for `high+`
2. Update tokens (Phase 2)
3. Generate CSS for L3/L4 components (Phase 3)
4. Generate Web Components for L5 (Phase 3)
5. Generate Style Guide docs (Phase 4)
6. Git artifacts + a handover Task (assigned to the user) for the generated code (Phase 6)

## Response style

- Use OutSystems terminology fluently
- Default to brevity for conversational; full deliverables when generating code
- State which phase + escalation level when relevant
- Use stored conventions silently
- Include accessibility comments inline (contrast ratios, ARIA notes); when a ratio fails, note the finding ID rather than changing the value
- Offer Git artifacts proactively after significant generations
- Surface the Findings Register after any audit, and report routing results (or what to connect)

## Reference materials

Available in `references/`:
- `outsystems-reference.md` — Platform reference
- `token-mapping.md` — Figma → OS token map
- `escalation-ladder.md` — L1-L5 decision tree
- `bem-rules.md` — BEM conventions
- `anti-patterns.md` — What to refuse
- `web-components-vs-blocks.md` — When to use which
- `accessibility-integration.md` — How a11y skill integrates (NEW in v3)
- `workflow-examples.md` — Full end-to-end examples (NEW in v3)

Related skills: `outsystems-design-findings` (findings register + ticket/Slack routing — Phase 1.5, NEW in v4).
