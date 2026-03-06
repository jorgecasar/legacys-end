# Task Completion Workflow

## 1. Branching
- Always create a feature branch: `type/issue-id-description`.
- No direct pushes to `main`.

## 2. Implementation
- Follow Jorge Casar persona: early returns, simplicity first, clean reactive code.
- Adhere to layered architecture.

## 3. Verification (MANDATORY)
Before finishing any task, you MUST:
1. Run `npm run lint` and fix all warnings/errors.
2. Run `npm run test:app` (or the relevant test suite).
3. If UI changes, run `npm run test:e2e`.
4. Ensure 100% coverage for Use Cases and critical logic.

## 4. Finalization
- Use **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.).
- **Atomic Commits**: Group related changes.
- **Squash**: Prefer squashing commits for a clean history.
- **PR Mandate**: Create a Pull Request using `gh pr create`.
- **Status Sync**: Move task to "Review" in GitHub Projects after PR creation.
