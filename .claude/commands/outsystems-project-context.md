---
name: outsystems-project-context
description: Capture and store per-project context (customer name and project name) the first time work begins on a new project. Use this skill at the start of any OutSystems task when no "OutSystems project:" memory entry exists, OR when the user mentions a different customer/project than the one currently in memory. This skill runs alongside (not instead of) the global outsystems-onboarding skill.
---

# Per-Project Context Capture

This skill captures lightweight project-level context (customer + project name) separate from global conventions. Stored via memory edits so it survives between conversations.

## When to use

Trigger when:
- A new OutSystems task is starting AND no `OutSystems project:` memory entry exists
- The user mentions a customer/project name that doesn't match the stored one
- The user explicitly says "new project" / "starting work on [client]"

**Do NOT trigger when:**
- Project context is already stored AND the user is continuing existing work
- The user is asking general OutSystems questions not tied to a specific deliverable

## Distinction from global onboarding

| Skill | Scope | Stored as |
|---|---|---|
| `outsystems-onboarding` | Account-wide conventions | `OutSystems convention: ...` |
| `outsystems-project-context` | Per-project metadata | `OutSystems project: ...` |

Both run independently. Global onboarding runs once per account; project context runs once per project.

## The capture flow

### Step 1: Detect from context (silent)

Before asking, scan the conversation for:
- Phrases like "for [Client Name]" / "the [Client] project" / "[Customer] portal"
- Figma URLs (the file name often includes the project)
- Previously mentioned project codenames

If you can confidently infer values, present them as defaults.

### Step 2: Ask minimally (2 questions max)

Use `ask_user_input_v0`. Single question if you have a confident guess; two if not.

**Question 1 — Customer name:**
- Format: free-text suggestion + common options if patterns detected
- Example: "What customer/client is this project for?"

**Question 2 — Project name:**
- Format: free-text or short options
- Example: "What's the project name or codename?"

If you detected the project from a Figma file or URL, present that as a pre-filled suggestion.

### Step 3: Store in memory

Use `memory_user_edits` with `add` command, prefixed exactly with "OutSystems project:" for findability:

```
OutSystems project: customer = "Acme Corp"
OutSystems project: name = "Customer Portal Redesign"
```

### Step 4: Acknowledge and proceed

Brief one-line confirmation:

> "Captured project context: Acme Corp / Customer Portal Redesign. Continuing with your task..."

Then immediately continue with whatever triggered this skill.

## Updating project context

When the user shifts to a new project mid-conversation:
- "We're done with Acme, starting on Globex now" → call `memory_user_edits` with `replace` command on both project lines
- "Working on a different client's portal today" → ask which one, then replace

When unsure if context applies:
- "Is this still for Acme Corp, or a different client?" → quick check before proceeding

## How other skills should use project context

When generating output, skills can reference project context to personalize:
- Component names can include project prefix if helpful: `acme-card` for Acme Corp
- Style Guide pages can include project header
- Commit messages (via `outsystems-git-helpers`) include project tag

But don't make this context-dependent everywhere — most output should still work without it.

## Forbidden behaviors

- ❌ Don't ask for project context for general questions ("what does ExtendedClass do?")
- ❌ Don't ask repeatedly if memory already has the values
- ❌ Don't store sensitive info (NDA contracts, internal pricing, etc.) — only customer name + project name
- ❌ Don't make project context block work — if the user just wants to dive in, capture lazily

## Examples

### Example 1: First conversation, Figma URL shared
```
User: "Audit this Figma file for me: figma.com/design/ABC123/AcmePortal-V2"

Claude: [Detects "AcmePortal" in URL]
        [Calls ask_user_input_v0 with one question pre-filled]
        "Is this for Acme Corp? And the project name — I see 'AcmePortal-V2' in the file — 
         is the project 'Acme Portal V2' or something different?"

User: [confirms or corrects]

Claude: [Stores in memory, proceeds with audit]
```

### Example 2: Generic question, no project context needed
```
User: "What's the difference between Block CSS and Theme CSS?"

Claude: [Skips project context capture — this is a general question]
        [Answers directly]
```

### Example 3: Project switch
```
User: "We're moving to the Globex Industries project now"

Claude: [Calls memory_user_edits with replace command]
        "Updated — now working on Globex Industries. What's the project name there?"
```
