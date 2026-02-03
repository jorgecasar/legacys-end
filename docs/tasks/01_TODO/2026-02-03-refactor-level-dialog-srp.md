# Task: Refactor LevelDialog for SRP

## Status
- **Status**: TODO
- **Priority**: Medium
- **Assignee**: AI Agent
- **Created**: 2026-02-03

## Context
The Architecture Review identified that `LevelDialog` has "mixed responsibilities" because it handles the logic for 6 different slide types in a single class. This makes it harder to maintain and extend.

## Objectives
- [ ] Extract each slide type into its own functional or class component (e.g., `dialog-slide-code`, `dialog-slide-narrative`).
- [ ] Simplify `LevelDialog.js` to only handle the dialog shell, navigation logic, and context consumption.
- [ ] Use a registry or a dynamic rendering pattern for slides.

## Success Criteria
- [ ] `LevelDialog.js` size reduced by at least 50%.
- [ ] All existing tests in `LevelDialog.spec.js` and `LevelDialog.interactions.spec.js` pass.
- [ ] No regression in E2E journey.
