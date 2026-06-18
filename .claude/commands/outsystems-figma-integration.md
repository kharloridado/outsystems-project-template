---
name: outsystems-figma-integration
description: Read Figma files directly via the connected Figma MCP to extract design tokens, component metadata, and visual references for OutSystems frontend work. Use this skill whenever the user shares a Figma URL, mentions a Figma file/frame/node, or asks to "pull" / "fetch" / "import" / "read" anything from Figma. This skill is the preferred entry point for Phase 1 audits when a Figma URL is available — it bypasses screenshot extraction entirely.
---

# Figma Integration (Direct MCP)

Pull design context, tokens, screenshots, and component metadata directly from Figma using the connected Figma MCP server.

## Pre-flight

1. Verify Figma MCP is connected (it's a deferred tool — call `tool_search` for "figma" if needed)
2. Check memory for "OutSystems convention:" entries → if missing, invoke `outsystems-onboarding`
3. Check memory for "OutSystems project:" entries → if missing, invoke `outsystems-project-context`
4. Use stored conventions in all output

## When to use

Trigger when the user:
- Shares a Figma URL (e.g., `figma.com/file/...` or `figma.com/design/...`)
- Says "import from Figma" / "pull this Figma file" / "read the Figma"
- Mentions a Figma frame, node ID, or component
- Says "use the Figma design" / "based on the Figma"

When the user only shares a screenshot (no URL), fall back to vision-based audit using `outsystems-component-audit`.

## Key Figma MCP tools

Use these via `tool_search` then call them. **Always read the tool descriptions returned by `tool_search` before calling** — parameter names matter.

### Primary tools

| Tool | When to use |
|---|---|
| `Figma:get_design_context` | **Primary tool for design-to-code workflow.** Pulls node structure + code-relevant data for a Figma node. Use first. |
| `Figma:get_variable_defs` | Extract design tokens (colors, typography, spacing) as Figma Variables. Critical for Phase 2. |
| `Figma:get_metadata` | Component properties, variants, descendant structure. Use when `get_design_context` isn't enough. |
| `Figma:get_screenshot` | Visual reference for a node. Use for Style Guide documentation. |
| `Figma:search_design_system` | Search for components/variables/styles by name. Use to check what already exists. |
| `Figma:get_libraries` | List design libraries linked to the file. Use during initial exploration. |
| `Figma:get_figjam` | Generate UI code from a FigJam node. Niche — use only if user shares a FigJam URL. |

### Parsing Figma URLs

Figma URLs have a structure: `figma.com/{file|design}/{fileKey}/{name}?node-id={nodeId}`

When the user shares a URL:
1. Extract `fileKey` (32-char alphanumeric)
2. Extract `node-id` if present (decoded from URL: replace `-` with `:`)
3. If no `node-id`, the URL refers to the whole file — ask which frame to focus on

## Workflow patterns

### Pattern A: Full screen audit from Figma URL

User: "Audit this Figma screen: [URL]"

Steps:
1. Parse URL → extract fileKey + nodeId
2. Call `Figma:get_design_context` with the node
3. Call `Figma:get_variable_defs` for the same node (gets tokens used)
4. Call `Figma:get_screenshot` for visual reference
5. Pass all extracted data to the `outsystems-component-audit` skill to classify components
6. Output: full Phase 1 audit (component inventory + brand flags + token deltas + plan)

### Pattern B: Token extraction only

User: "Pull the design tokens from [Figma URL]"

Steps:
1. Parse URL
2. Call `Figma:get_variable_defs` for the entire file or specific node
3. Pass to `outsystems-token-extractor` skill to generate `:root` block
4. Output: paste-ready `:root` CSS block

### Pattern C: Single component analysis

User: "Look at this card component in Figma: [URL with node-id]"

Steps:
1. Parse URL → extract nodeId of the specific component
2. Call `Figma:get_design_context` for that node
3. Call `Figma:get_metadata` to understand variants/properties
4. Call `Figma:get_screenshot` for documentation
5. Determine escalation level (L1–L5) based on whether OS UI has a match
6. Route to `outsystems-bem-css` (L3-L4) or `outsystems-web-component` (L5)

### Pattern D: Design system inventory

User: "What components are in our design system?"

Steps:
1. Call `Figma:get_libraries` to find the design system file
2. Call `Figma:search_design_system` for components
3. Cross-reference with OutSystems UI pattern catalog
4. Output: mapping of Figma components → OutSystems UI patterns + gaps

## What to extract from `get_design_context`

The returned context includes node structure (layers, frames, instances), text content, styles, and any linked components. When processing:

- **Layout structure** → maps to OutSystems UI Columns / Layout patterns
- **Text styles** → check against `--font-size-*`, `--font-family-*`, `--font-weight-*`
- **Fill colors** → check against `--color-*` tokens
- **Effects (shadows)** → check against `--shadow-*` tokens
- **Corner radius** → check against `--border-radius-*` tokens
- **Auto-layout spacing/padding** → check against `--space-*` tokens
- **Component instances** → flag as potential OutSystems UI pattern matches

## What to extract from `get_variable_defs`

Figma Variables (the new design tokens system) come categorized:

| Figma Variable Type | OutSystems UI variable family |
|---|---|
| COLOR | `--color-*` |
| FLOAT (for spacing/sizing) | `--space-*` or `--font-size-*` |
| STRING (font names) | `--font-family-*` |
| BOOLEAN (rare) | Generally skip |

Pass the variable list directly to `outsystems-token-extractor` for mapping.

## Output guidance

After pulling Figma data, present a brief summary before proceeding:

```
✅ Pulled from Figma:
  - File: [name]
  - Frame/Node: [name]
  - Components found: 12 (8 instances of 4 unique components)
  - Variables: 24 colors, 8 typography, 16 spacing
  - Screenshot: [reference for Style Guide]

Proceeding with [Phase 1 audit / token extraction / component analysis]...
```

Then route to the appropriate downstream skill.

## When Figma MCP fails

If a Figma tool call returns an auth error or empty result:
1. Try `Figma:whoami` to verify the connection is alive
2. If auth fails, tell the user to reconnect Figma in their connector settings
3. If the node ID is invalid, ask the user to verify the URL
4. If access is denied, the user may not have view permissions on that file

Don't loop on retries — surface the issue clearly and let the user act.

## References

- `references/figma-url-parsing.md` — How to parse Figma URLs into fileKey + nodeId
- `references/figma-tool-recipes.md` — Specific tool call patterns for common scenarios
- `references/variable-mapping.md` — Figma Variable types → OutSystems CSS variable families
