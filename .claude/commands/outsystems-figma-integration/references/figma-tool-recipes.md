# Figma MCP Tool Recipes

Common task patterns and which Figma tools to use. Always call `tool_search` first to load tool schemas before calling.

## Recipe 1: New Figma handoff audit

**User input:** Full Figma URL for a screen frame.

**Tool sequence:**
```
1. tool_search("figma design context")
2. Figma:get_design_context(fileKey, nodeId)
3. Figma:get_variable_defs(fileKey, nodeId)
4. Figma:get_screenshot(fileKey, nodeId)
```

**Why this order:**
- `get_design_context` gives you the structural map fastest
- `get_variable_defs` extracts tokens in parallel use
- `get_screenshot` is for your final deliverable (Style Guide ref)

## Recipe 2: Token-only extraction

**User input:** "Pull tokens from this Figma file"

**Tool sequence:**
```
1. tool_search("figma variable definitions")
2. Figma:get_variable_defs(fileKey)   ← no nodeId = whole file
```

**Why:**
- Tokens are defined at the file level in Figma Variables
- Skip everything else; just need the variable dictionary

## Recipe 3: Component-specific deep dive

**User input:** "Analyze this specific component" (with node-id pointing to a Component or Instance)

**Tool sequence:**
```
1. tool_search("figma metadata")
2. Figma:get_metadata(fileKey, nodeId)    ← properties, variants, descendants
3. Figma:get_design_context(fileKey, nodeId)
4. Figma:get_screenshot(fileKey, nodeId)
```

**Why metadata first:**
- Reveals if it's a Component vs an Instance
- Shows component properties (boolean toggles, variant axes)
- Shows what variants exist

## Recipe 4: Inventory the design system

**User input:** "What's in our design system?"

**Tool sequence:**
```
1. tool_search("figma libraries design system")
2. Figma:get_libraries(fileKey)
3. Figma:search_design_system(query)   ← if specific search needed
```

## Recipe 5: Verify Figma connection

When something seems off:
```
1. Figma:whoami()
```
Returns the authenticated user. If this fails, the connection is broken — tell the user to reconnect.

## Tool parameter conventions

These are general patterns. **Always verify parameter names by reading the schema returned from `tool_search`** — they may differ.

| Parameter | Format | Example |
|---|---|---|
| `fileKey` | string, 22-32 chars | `"ABCdef123GHIjklMNOpqrSTU"` |
| `nodeId` | string, colon-separated | `"42:1029"` (NOT `"42-1029"`) |
| `clientName` | string (optional) | `"claude-outsystems-workflow"` |

## Common errors and fixes

| Error | Fix |
|---|---|
| `Invalid node ID` | URL had `node-id=42-1029`; convert hyphen to colon: `42:1029` |
| `File not found` | fileKey wrong, or user doesn't have access |
| `Unauthorized` | Figma connection expired; reconnect in settings |
| `Empty response` | Node has no children; try parent node instead |
| `Rate limit` | Wait ~30 seconds; Figma MCP rate-limits aggressively |

## Performance notes

- `get_design_context` on a large frame can return a lot of data; consider zooming in to a specific section first
- `get_variable_defs` is cheap; call it freely
- `get_screenshot` returns image data; cache mentally — don't re-fetch the same node
