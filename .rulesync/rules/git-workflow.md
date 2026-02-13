---
targets: ["*"]
description: "Git branching and merging strategy"
---

# Git Workflow Standards

- **Branching**: Feature branches `type/issue-id-description`.
- **Merging**: Fast-Forward (FF) only. Rebase on `main`. No merge commits.
- **Commits**: Conventional Commits. Atomic changes.
- **CI/CD**: `[skip ci]` ONLY for pure docs or internal rule tweaks. If logic/tests change, CI must run.
