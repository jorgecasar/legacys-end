# Enforce Documentation Updates <!-- id: enforce-docs-update -->

> **Status**: DONE
> **Created**: 2026-02-03
> **Last Updated**: 2026-02-03

## Context & Goal
Ensure documentation (Architecture, Standards, Tech Ref) remains the source of truth by mandating updates with every code change.

## Plan
- [x] Update `docs/PROJECT_STANDARDS.md`: Add "Keep Maintenance" rule.
- [x] Update `.agent/skills/commit-changes/SKILL.md`: Add "Docs Updated?" check.

## Memory / Current State
Done.
1. Standards now explicitly require updating `TECHNICAL_REFERENCE`, `STANDARDS`, and `ARCHITECTURE`.
2. Commit skill asks "Have you updated the relevant documentation?" before proceeding.

**Resolution**: Documentation hygiene is now part of the core workflow.
