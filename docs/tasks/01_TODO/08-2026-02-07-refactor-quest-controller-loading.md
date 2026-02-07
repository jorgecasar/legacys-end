# Refactor QuestController Loading Logic <!-- id: 2026-02-07-refactor-quest-controller-loading -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
`QuestController` currently mixes orchestration logic (state changes, navigation) with data fetching logic (loading quests/chapters via `Task`). This violates the Single Responsibility Principle.

## Plan
- [ ] Extract the `loadQuest` and `loadChapter` data fetching logic into a `QuestLoaderService` or similar helper.
- [ ] Ensure `QuestController` receives fully loaded/validated data or simple signals, rather than managing the async fetching lifecycle directly.
- [ ] Add error boundary handling for failed quest loads.

## Artifacts
- `src/controllers/quest-controller.js`
- `src/services/quest-loader-service.js` (new)

## Memory / Current State
- `QuestController` reviewed.
- Next step: Create `QuestLoaderService`.
