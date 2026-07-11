# loop/refs — Frozen Figma spec snapshots

One folder per work item, named for the `state.json` item id. The **orchestrator** saves these via the Figma MCP **before** delegating to the maker, because subagents have **no Figma MCP access** — so this folder, not live Figma and not the handover prose, is the spec of record. The **maker builds to the ref**; the **checker judges against the ref**.

**No ref means the item goes `needs-human`. It is never built.** A maker with no frozen spec is guessing, and a checker with no frozen spec cannot tell a faithful build from a plausible one. This rule is also what makes headless, unattended runs fidelity-capable at all.

## Contents per item

- `spec.md` — provenance (**Figma file key**, node id, pull date) plus the key-value table for the node; for actively-reviewed items, also the `get_design_context` reference code.
- `variables.json` — the verbatim `get_variable_defs` output for the node, under a `variables` key, with `_meta` provenance.
- `figma.png` — the `get_screenshot` render of the node. Also used by the orchestrator's post-PASS visual check against the preview render.

## Capture every size variant and every device frame

A component's ref is not one screenshot of one variant. Pull **each size variant** (small / regular / large / xlarge — whatever the component set defines) and **each device frame** (mobile / tablet / desktop) the design provides.

This matters because Figma variables are **mode-bound**: the same variable name can resolve to a different value per size or per device. If you snapshot one variant and freeze that value into a shared token, every other size silently renders wrong, and nothing in the build fails — the component simply looks correct at the size you happened to capture and wrong everywhere else. **A variable whose value changes across sizes or devices is not one token; it must become per-size (or per-breakpoint) tokens.** Record in `spec.md` which variants and frames were captured, and which mode axis each varying variable is bound to.

## Staleness — the file key is part of the spec

`spec.md` records the Figma **file key** the ref was pulled from. If that key differs from the current library key in `loop/goal.md`, **the ref is stale**: mark the item `needs-re-ref`, re-snapshot, and do not build or judge against the old values. Libraries get duplicated, forked and re-versioned, and the fork looks identical from the outside while resolving different values. Log the key change in `design/figma-links.md` so the supersession is visible.

## Operational lessons

- **A whole documentation page is usually too large for one `get_design_context` pull** — it comes back as sparse metadata with none of the values you need. Snapshot the page screenshot and variables, then **deep-pull the component-set sublayer** (the `State=…` symbols frame) for the value-bearing code, and record the sublayer node id in `spec.md`.
- **`get_screenshot` URLs are short-lived.** `curl` the URL to `figma.png` immediately in the same step; do not save the URL and fetch it later.

## Items without a durable node id

An item built from a live desktop selection with no link recorded has no reproducible ref. Mark it `needs-ref-id`, record the gap in `design/figma-links.md`, and snapshot it lazily on the next re-review. It does not get treated as if it had a ref.
