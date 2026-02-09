---
targets: ["*"]
description: "Git branching and merging strategy"
---

# Git Workflow Standards

## Branching Strategy
- Use **Feature Branches** for all changes.
- Naming convention: `<type>/<issue-id>-<short-description>`
  - Examples: `feat/12-add-login`, `fix/45-storage-bug`, `chore/setup-ci`.

## Merging Strategy
- Use **Fast-Forward (FF)** merges only.
- Never create merge commits.
- Rebase your feature branch on top of `main` before merging.

## Commits
- All commits must follow the **Conventional Commits** specification (see `conventional-commits` skill).
- Keep commits atomic and focused on a single change.
- **CI/CD Optimization**: Add `[skip ci]` to the commit message for changes that do not affect the application's deployment or production behavior (e.g., updates to documentation, internal AI rules, or Markdown files).
