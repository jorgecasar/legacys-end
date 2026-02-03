# Setup Storybook Catalog <!-- id: setup-storybook -->

> **Status**: DONE
> **Created**: 2026-02-03
> **Last Updated**: 2026-02-03

## Context & Goal
Establish a component catalog using Storybook to ensure components are decoupled, independently testable, and documented. This will serve as a visual regression baseline and a development environment for UI isolation.

## Plan
- [x] Create task.
- [x] Initialize Storybook for Lit + Vite.
- [x] Configure Storybook to support `@lit/context` providers.
- [x] Create initial stories for core components:
    - [x] `quest-card`
    - [x] `level-dialog`
- [x] Verify independent functionality in Storybook.

## Artifacts
- `.storybook/` configuration directory.
- `src/components/**/*.stories.js` files.

## Memory / Current State
1. Storybook initialized and configured with global context providers.
2. Initial stories created for QuestCard and LevelDialog.
3. Component catalog is ready for use.
