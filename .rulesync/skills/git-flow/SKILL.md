---
name: git-flow
description: Standardized git flow and atomic tasks.
---
# Skill: Git Flow (MCP)

## Purpose
Standardize git operations across all agents to ensure a clean history and reliable branch management.

## Instructions
- **Branch Naming**: Use `task/issue-{id}-{slug}` for feature branches.
- **Committing**: Follow [Conventional Commits](https://www.conventionalcommits.org/).
    - `feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`.
- **Atomic Commits**: Commit changes in logical chunks (e.g., "test: add failing test for X", "feat: implement X").
- **Pushing**: Push often to the remote to allow "Paused" tasks to be resumed.

## Operating Rules
- Never push directly to `main`.
- Always sync with the remote (`pull --rebase`) before starting a session on an existing branch.

## Tooling
- Use MCP for basic git operations (`git_log`, `git_status`, etc.).
- Use terminal for `git checkout -b` or complex rebases if needed.
