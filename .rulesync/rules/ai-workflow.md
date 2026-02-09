---
targets: ["geminicli"]
description: "Instructions for the AI Agent's autonomous workflow"
globs: ["**/*"]
---

# AI Agent Autonomous Workflow

When you are acting as an autonomous agent (e.g., triggered by GitHub Actions), you MUST follow these steps to ensure high-quality contributions:

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
