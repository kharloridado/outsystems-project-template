# Using Figma MCP Tools Effectively

The user has Figma connected as an MCP tool. Always prefer pulling data directly over asking for screenshots.

## Tool inventory

| Tool | What it returns | When to call |
|---|---|---|
| `get_design_context` | Structured design data — components, layout, properties | Primary tool for any audit |
| `get_screenshot` | Image of the frame/node | Visual context, embedding in responses |
| `get_metadata` | Component definitions, variants, instances | Identifying which components are used |
| `get_variable_defs` | Figma Variables (design tokens) | Token extraction (Phase 2) |
| `get_code_connect_map` | Component → code mapping (if set up) | Verifying existing implementations |
| `create_design_system_rules` | Design system guidance from a file | Generating Style Guide content |
| `get_figjam` | FigJam board content | Workshop notes, design rationale |

## Recognizing Figma URLs

These patterns indicate the user shared a Figma link:
- `https://www.figma.com/file/...`
- `https://www.figma.com/design/...`
- `https://www.figma.com/board/...` (FigJam)
- `https://www.figma.com/proto/...` (Prototype)

The URL may include a `node-id` query parameter pointing to a specific frame/component.

## Workflow per audit phase

### Phase 1: Component Audit

```
1. get_design_context(figma_url)
   → Identify all components in the frame, their types, variants
2. get_screenshot(figma_url)
   → Capture visual for the response
3. get_metadata(figma_url)
   → Get component definitions (any component already linked to code?)
```

Use the results to classify components more accurately than visual inspection.

### Phase 2: Token Extraction

```
1. get_variable_defs(figma_file_url)
   → Pull all Variables: colors, spacing, typography, etc.
2. Map each Variable to OutSystems UI naming convention
3. Generate :root block with mapped values
```

Figma Variable categories typically map cleanly:
- Figma "Color/Brand/Primary" → `--color-primary`
- Figma "Spacing/m" → `--space-m`
- Figma "Typography/Body" → `--font-family-body`

If the Figma file follows OutSystems UI Kit 2.0 conventions, mapping is 1:1.

### Phase 4: Style Guide Documentation

```
1. get_design_context — structure for anatomy diagrams
2. get_metadata — variant list for "Variants" section
3. get_screenshot per state — for the visual gallery
```

## When the URL points to a specific node

If the URL contains `?node-id=...`, the user is asking about that specific frame/component, not the whole file. Scope your queries accordingly.

## Handling errors gracefully

If a Figma MCP tool fails:
- "Access denied" → the user may need to share the file with the Figma connector
- "Not found" → URL might be wrong; ask for correct one
- Timeout → ask user to paste a screenshot as fallback

Don't block on Figma failures. Fall back to visual analysis from a screenshot.

## Privacy / caution

- Don't dump raw Figma data into responses unless asked — extract the relevant info
- Don't reveal Figma file IDs or sensitive client info inadvertently
- If the file appears to contain confidential branding for a NEW unannounced product, treat with discretion

## Combining with stored conventions

Always pair Figma data with stored conventions:

```
User shares Figma URL.

Steps:
1. Check memory → stored prefix is "cb-", environment is ODC, accessibility is WCAG 2.2 AA
2. get_design_context(url) → identifies 8 components
3. get_variable_defs → 47 design tokens
4. Run audit using stored conventions:
   - Generate BEM class names with "cb-" prefix
   - Match tokens to OutSystems UI variable names
   - Apply WCAG 2.2 AA check to all components
```

## Triggering refresh

If the designer updates the Figma file mid-conversation:
- User says "the designer updated the file" → re-run `get_design_context` for fresh data
- Don't rely on cached values

## Example invocations

```
User: "Audit this screen: https://www.figma.com/design/abc123/Banking-App?node-id=42:158"

Claude:
[Internal] tool_search → find figma tools
[Tool call] get_design_context(url="https://www.figma.com/design/abc123/Banking-App?node-id=42:158")
[Tool call] get_screenshot(url=...)
[Tool call] get_variable_defs(url=...)

[Respond with full Phase 1 audit using real data]
```
