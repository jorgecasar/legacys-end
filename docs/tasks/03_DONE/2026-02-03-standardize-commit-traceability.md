# Standardize Commit Traceability <!-- id: standard-commit-trace -->

> **Status**: DONE
> **Created**: 2026-02-03
> **Last Updated**: 2026-02-03

## Context & Goal
Link git commits to Kanban tasks for better traceability.
Rule: One task should ideally result in one atomic commit (or a series of linked commits).
Mechanism: Include `Task: #[task-id]` in the commit message footer.

## Plan
- [x] Update `.agent/skills/commit-changes/SKILL.md` (instructions for ID).
- [x] Update `docs/PROJECT_STANDARDS.md` (Atomic Commits + Message Footer).
- [x] **Add "Review Protocol"**: Findings -> New Task (don't fix out of scope or forget).

## Memory / Current State
Done.
1. `commit-changes` skill now asks for Task ID in footer.
2. Standards enforced for "1 Task = 1 Commit" (ideal).
3. Standards enforced for "Review Protocol" -> Create new tasks for out-of-scope findings.

**Resolution**: Traceability and Continuous Improvement loop established.
