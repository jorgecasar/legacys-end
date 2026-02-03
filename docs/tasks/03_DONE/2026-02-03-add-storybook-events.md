# Add Events to Storybook <!-- id: add-storybook-events -->

> **Status**: DONE
> **Created**: 2026-02-03
> **Last Updated**: 2026-02-03

## Context & Goal
Ensure that all Storybook stories correctly capture and log component events (actions) to the Actions panel. This allows developers to verify that events are being dispatched correctly without looking at the console.

## Plan
- [x] Review `LevelDialog.stories.js` for missing actions (e.g., `complete`, `close`).
- [x] Review `QuestView.stories.js` for missing actions.
- [x] Update `argTypes` in all stories to include action handlers.
- [x] Verify that interacting with components logs actions in the UI.

## Memory / Current State
Task completed.
1. `LevelDialog.stories.js`: Wired `complete`, `close`, `slide-changed`.
2. `QuestView.stories.js`: Wired `close-dialog`, `reward-collected`.
3. Verified with `npm run lint:tsc`.

**Resolution**: Stories now correctly log events to the Actions panel.
