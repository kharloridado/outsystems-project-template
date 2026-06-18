# Parsing Figma URLs

## URL formats

Figma URLs come in several variants:

```
https://www.figma.com/file/{fileKey}/{name}
https://www.figma.com/design/{fileKey}/{name}
https://www.figma.com/file/{fileKey}/{name}?node-id={nodeId}
https://www.figma.com/design/{fileKey}/{name}?node-id={nodeId}&t={timestamp}
```

## Components to extract

### fileKey
- 22-32 character alphanumeric string
- Located between `/file/` or `/design/` and the next `/`
- Example: `ABCdef123GHIjklMNOpqrSTU`

### nodeId
- Format in URL: `123-456` (hyphen-separated)
- Format in API: `123:456` (colon-separated)
- **You must convert hyphens to colons** when passing to Figma MCP tools
- Example: URL `?node-id=42-1029` → API uses `42:1029`

### Other parameters (usually ignore)
- `t={timestamp}` — sharing token, ignore
- `mode=` — viewing mode, ignore
- `viewport=` — pan/zoom state, ignore

## Parsing examples

| URL | fileKey | nodeId |
|---|---|---|
| `figma.com/file/ABC123/MyDesign` | `ABC123` | (whole file) |
| `figma.com/design/ABC123/MyDesign?node-id=42-1029` | `ABC123` | `42:1029` |
| `figma.com/design/ABC123/X?node-id=1-2&t=xyz` | `ABC123` | `1:2` |

## When no nodeId is provided

If the URL points to the whole file (no `node-id`), ask the user:
- "Which specific frame or component should I focus on?"
- Suggest using `Figma:get_libraries` first to list available pages/frames

## When the user pastes only a node ID

Sometimes the user shares just `42:1029` or `42-1029` without a URL. In that case:
- Check if they've shared the fileKey earlier in the conversation
- Check memory for "OutSystems project: figma file = ..." entry (if project context has it)
- Otherwise ask for the full URL or fileKey separately
