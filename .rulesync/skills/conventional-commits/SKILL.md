---
name: conventional-commits
description: "Guidelines and assistance for writing and validating commit messages following the Conventional Commits specification."
targets: ["*"]
---

# Conventional Commits Skill

This skill ensures all commit messages in the project follow the **Conventional Commits v1.0.0** specification.

## Core Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Workflows

### 1. Generating a Commit Message

When asked to write or suggest a commit message:
1.  **Analyze changes**: Use `git diff --staged` or `git status`.
2.  **Determine Type**: Choose from: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
3.  **Define Scope (Optional)**: Identify the affected area (e.g., `ui`, `core`).
4.  **Write Description**: Concise, imperative summary.

## Reference

For detailed rules and examples, see [references/specification.md](references/specification.md).
