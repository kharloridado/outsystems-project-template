---
name: outsystems-onboarding
description: One-time global onboarding to detect and store the user's OutSystems frontend conventions (class prefix, default environment, spacing scale, token naming style). Use this skill ONLY when no prior global onboarding has occurred (no "OutSystems convention:" memory entries exist) AND any other OutSystems skill is about to trigger. Once complete, conventions are stored permanently via memory edits and this skill never needs to run again.
---

# Global Conventions Onboarding (Account-Level)

This is the **global, account-level** onboarding. It runs once per Claude account and captures conventions that apply to ALL projects. For per-project context (customer, project name), see `outsystems-project-context`.

## When to use

Use this skill ONLY in these conditions:
- Another OutSystems skill is about to trigger
- AND no prior global onboarding has happened (no memory entries with `OutSystems convention:` prefix)

If memory already contains the conventions, **skip this skill entirely**.

## What this captures (4 things)

These are global and apply to all your OutSystems work:

1. **Class prefix** — e.g., `acme-`, `mycorp-`, `brand-`
2. **Default environment** — O11 / ODC / Both
3. **Spacing base unit** — 4pt / 8pt
4. **Token naming style** — OutSystems UI standard / Custom prefix / Other

## Hybrid flow: auto-detect first

### Step 1: Scan conversation context (silent)

Before asking anything, look for:
- CSS the user has shared → extract prefix pattern (look for repeated `^\.\w{2,6}-`)
- `:root` declarations → extract token naming convention
- Mentions of "O11", "ODC", "Reactive Web" → infer environment
- Spacing values `8px`, `4px`, `16px` → infer base unit

If detected with confidence, present as defaults; otherwise ask.

### Step 2: Ask minimally

Use `ask_user_input_v0` with 1–4 questions depending on what was detected:

**If nothing detected, ask all 4:**

1. **Class prefix** (free text or common options)
2. **Environment** — O11 / ODC / Both
3. **Spacing base** — 4pt / 8pt
4. **Token naming** — OutSystems UI standard / Custom prefix / Other

If some were detected, only ask for the missing ones.

### Step 3: Store in memory

Use `memory_user_edits` with `add` command. Format **exactly**:

```
OutSystems convention: prefix = "acme-"
OutSystems convention: environment = "ODC"
OutSystems convention: spacing base = 8pt
OutSystems convention: token style = "OutSystems UI standard"
```

The exact "OutSystems convention:" prefix is critical so other skills can find these.

### Step 4: Brief acknowledgment, continue

> "Saved: `acme-` prefix, ODC environment, 8pt spacing, OutSystems UI tokens. These won't be asked again."

Then immediately continue with the original task — don't make the user re-prompt.

## What this does NOT capture

- Customer name / project name → that's `outsystems-project-context`
- Accessibility preferences → WCAG 2.2 AA is the default (handled by `outsystems-accessibility`)
- Figma file URLs → captured per-project if relevant

## Updating conventions later

If the user says "actually my prefix is X" or "switch to ODC default":
1. Use `memory_user_edits` with `replace` command
2. Brief acknowledgment: "Updated — using X going forward"

## Forbidden behaviors

- ❌ Don't ask global onboarding questions if memory already has them
- ❌ Don't ask for project-specific info (customer/project name) — that's a separate skill
- ❌ Don't run onboarding for casual questions ("what does ExtendedClass do?")
- ❌ Don't ask more than 4 questions
- ❌ Don't make the user repeat their request — chain directly into the task

## Examples

### Example 1: Nothing detected
```
User: "Generate CSS for a card component"

Claude: [No conventions stored, no patterns detected]
        [Calls ask_user_input_v0 with all 4 questions]

User: [taps answers: acme-, ODC, 8pt, OutSystems UI standard]

Claude: [Stores in memory]
        "Saved: acme- prefix, ODC environment, 8pt spacing, OutSystems UI tokens."
        [Continues with the CSS generation using these values]
```

### Example 2: Partial detection from prior CSS
```
User: [Shares some CSS earlier using `.acme-card { ... }`]
User: "Generate CSS for a button"

Claude: [Detected prefix `acme-` from prior CSS. Conventions partial.]
        [Asks only 3 questions: environment, spacing, token style]

User: [answers]

Claude: [Stores all 4 in memory, including the detected prefix]
        [Generates button CSS]
```
