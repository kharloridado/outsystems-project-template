# ModelAPI Agent CLI Reference

## Binary

`rd-ai-dotnet-cli` (installed at `~/.local/bin/rd-ai-dotnet-cli`)

## Commands

### `agent converse` — Single-turn (recommended for Claude Code)

Fire-and-forget: send one prompt, get human-readable output, OML modified in-place.

```bash
rd-ai-dotnet-cli agent converse "<prompt text>" \
  --oml <path-to-oml> \
  --mode model-api \
  --url ws://localhost:8000/ws
```

**Important:**
- The `--oml` file is modified IN-PLACE. Always copy the original first.
- The prompt is a positional argument (can be up to ~250KB on macOS).
- For large prompts, read from file: `"$(cat output/MyApp/spec.json)"`
- Output is human-readable text with `[tool]` indicators — NOT JSONL.
- Exit code 0 = success.

### `agent connect` — Persistent JSONL session (for programmatic use)

Interactive JSONL protocol over stdin/stdout.

```bash
rd-ai-dotnet-cli agent connect \
  --oml <path-to-oml> \
  --mode model-api \
  --url ws://localhost:8000/ws
```

**stdin commands:**
```json
{"cmd": "converse", "prompt": "Add a Product entity"}
{"cmd": "status"}
{"cmd": "modes"}
{"cmd": "disconnect"}
```

**stdout events:**
```json
{"type": "connected", "connectionId": "...", "oml": "...", "url": "..."}
{"type": "message", "content": "partial response text"}
{"type": "tool_begin", "name": "getElementsJson"}
{"type": "tool_end", "name": "getElementsJson"}
{"type": "turn_complete"}
{"type": "error", "content": "..."}
{"type": "disconnected"}
```

### `agent chat` — Interactive terminal session

For manual testing. Opens an interactive prompt.

```bash
rd-ai-dotnet-cli agent chat \
  --oml <path-to-oml> \
  --mode model-api \
  --url ws://localhost:8000/ws
```

### `agent modes` — List available modes

```bash
rd-ai-dotnet-cli agent modes --url ws://localhost:8000/ws
```

Returns modes like `model-api`, `vibe-generic`, `orchestrator`, etc.

## Agent Modes

| Mode | Purpose |
|---|---|
| `model-api` | ModelAPI agent — writes C# lambdas to build OutSystems apps |
| `vibe-generic` | Conversational agent (default) |
| `orchestrator` | Multi-step orchestrator |

Always use `--mode model-api` for spec-to-OML generation.

## Default Initial OML

```
oml/initial.oml
```

## Typical Workflow from Claude Code

```bash
# 1. Create working directory
mkdir -p output/MyApp

# 2. Copy initial OML (agent modifies in-place)
cp oml/initial.oml output/MyApp/work.oml

# 3. Run the agent with the spec
rd-ai-dotnet-cli agent converse "$(cat output/MyApp/spec.json)" \
  --oml output/MyApp/work.oml \
  --mode model-api \
  --url ws://localhost:8000/ws

# 4. Result is at output/MyApp/work.oml (modified in-place)
mv output/MyApp/work.oml output/MyApp/result.oml
```

## Session Resume

To continue a prior conversation, pass `--session <id>`:

```bash
rd-ai-dotnet-cli agent converse "Now add validation to the form" \
  --oml output/MyApp/result.oml \
  --mode model-api \
  --url ws://localhost:8000/ws \
  --session <session-id-from-previous-run>
```
