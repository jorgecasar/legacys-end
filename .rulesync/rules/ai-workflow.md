---
targets: ["geminicli"]
description: "Instructions for the AI Agent's autonomous workflow"
globs: ["**/*"]
---

# AI Agent Autonomous Workflow

## Workflow Mandates
- **No Direct Pushes to Main**: Always use feature branches (`type/id-description`).
- **PR Mandate**: Create a PR (`gh pr create`) to resolve any task.
- **CI Validation**: Never skip CI for logic/test changes.

## Steps
1. **Analyze**: Explore codebase with `Serena` before planning.
2. **Plan**: Formulate a clear plan.
3. **Implement**: Clean, reactive code (Tabs, Jorge Casar persona).
4. **Verify**: Run `npm run lint` and `npm test` before finalizing.
5. **Finalize**: Provide a concise summary. State if tests fail.
