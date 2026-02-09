---
name: git-workflow
description: >-
  Guidelines for managing the git workflow, ensuring clean commit history
  and keeping branches up to date with main.
---
# Git Workflow Skill

This skill ensures that the project's Git history remains clean, organized, and properly synchronized.

## Core Mandates

### 1. Minimal Commits
- **Goal**: Aim for a single, high-quality commit per feature or bug fix.
- **Action**: Use `git commit --amend` or interactive rebase if multiple commits are created during development before finalizing the PR.
- **Description**: The final commit should be atomic and represent the complete solution for the task.

### 2. Always Rebased
- **Goal**: Ensure the feature branch is always based on the latest version of `main`.
- **Action**: Before submitting for review or after a pause, rebase the feature branch on `main`.
```bash
git fetch origin main
git rebase origin/main
```
- **Conflict Resolution**: If conflicts occur during rebase, resolve them while maintaining the integrity of the feature changes.

### 3. Conventional Commits
- Use the `conventional-commits` skill for all commit messages.

## Workflows

### 1. Starting or Resuming Work
1. Fetch latest changes: `git fetch origin main`.
2. Rebase: `git rebase origin/main`.

### 2. Finalizing a Task
1. Squash intermediate commits if any: `git rebase -i main` (or similar).
2. Ensure the branch is rebased one last time.
3. Push to origin.
