# Extract Verify Skill <!-- id: extract-verify -->

> **Status**: DONE
> **Created**: 2026-02-03
> **Last Updated**: 2026-02-03

## Context & Goal
Decouple verification logic (lint, test, build) from the `commit-changes` skill. This allows independent verification without forcing a commit, and simplifies the commit skill.

## Plan
- [x] Verify task naming conventions
- [x] Create `.agent/skills/verify-changes/SKILL.md`
- [x] Refactor `.agent/skills/commit-changes/SKILL.md` (remove verification)
- [x] Update `docs/PROJECT_STANDARDS.md` (mandate usage)

## Memory / Current State
Extraction complete.
1. `verify-changes` skill created (lint, tsc, lit, test, build).
2. `commit-changes` skill simplified (depends on verify).
3. Standards updated to enforce verification before commit.

**Resolution**: Skills are now decoupled and robust.
