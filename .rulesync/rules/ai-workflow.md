---
targets: ["geminicli"]
description: "Instructions for the AI Agent's autonomous workflow"
globs: ["**/*"]
---

# AI Agent Autonomous Workflow

## Workflow Mandates (STRICT)
- **No Direct Pushes to Main**: You MUST NEVER push code changes directly to the `main` branch. All feature work, bug fixes, or refactors MUST be done in a feature branch.
- **PR Mandate**: You MUST always create a Pull Request (`gh pr create`) when resolving a task, unless explicitly told otherwise by the user.
- **CI Validation**: Code changes MUST ALWAYS trigger CI. Never use `[skip ci]` for commits that include logic, tests, or architectural changes.

## 1. Analysis & Planning
- Thoroughly analyze the issue or feedback.
- Use `Serena` tools to explore the relevant parts of the codebase.
- Formulate a clear plan before making any edits.

## 2. Implementation
- Apply changes following the project's standards (Clean Architecture, Lit standards, Tabs for indentation).
- Ensure code is self-documenting and follows the "Jorge Casar" developer persona.

## 3. Verification (CRITICAL)
- After making changes, you MUST verify them by running the following commands in the shell:
  - `npm run lint`: To ensure no style or linting regressions were introduced.
  - `npm test`: To ensure all unit tests pass.
- If any check fails, you MUST fix the issues before finalizing your response.
- Do NOT skip this step unless the changes are purely documentation-related and have no impact on the code.

## 4. Finalization
- Provide a concise summary of your changes in your final response.
- If you are unable to fix a failing test, clearly state it so a human maintainer can take over.
