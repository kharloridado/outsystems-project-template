# Figma Links

Every component, page and token source the loop pulls from, with the **file key** it was pulled from. One row per source. The `outsystems-figma-integration` skill reads these via MCP; `loop/refs/<item-id>/spec.md` records the same provenance per frozen ref.

| Component / page | Figma file key | Node id | Pulled on | Supersedes |
|---|---|---|---|---|
| `<e.g. Button>` | `<<FIGMA_FILE_KEY>>` | `<12345-678>` | `<yyyy-mm-dd>` | `<earlier key:node this replaces, or —>` |
| | | | | |

## Why the file key is tracked, not just the URL

A Figma URL is not a stable identity. Libraries get duplicated, forked and re-versioned, and the copy carries a **different file key** while looking identical in a screenshot, in a conversation, and often in the layer tree.

On the source project this template is derived from, a new Figma file appeared mid-build — a "Main Library (2)" — that silently re-versioned values in place. A field's corner radius, for example, migrated from a pill to 8px. Nothing announced the change. Every frozen ref pulled from the *old* file key was still sitting in `loop/refs/`, still looked authoritative, and was now describing a component that no longer existed. The build kept passing its own checks against a spec that had been superseded.

So: record the file key on every row, record it in every ref's `spec.md`, and keep `loop/goal.md` and `state.json.figma_file_key` pointing at the current library. When the key changes, add new rows, fill in **Supersedes**, and mark the affected refs `needs-re-ref` — a ref frozen against an old file key is stale by definition, not merely old.
