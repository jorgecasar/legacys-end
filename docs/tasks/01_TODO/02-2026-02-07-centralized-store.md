# Implement Centralized State Store <!-- id: 2026-02-07-centralized-store -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
State is currently scattered across multiple services (HeroState, WorldState, QuestState), making it difficult to debug the "Source of Truth".

## Plan
- [ ] Create a centralized `GameStore` using `@lit-labs/signals`.
- [ ] Group related signals (Hero, World, Quest) within the store but keep them accessible.
- [ ] Implement an "Action" pattern to modify state, ensuring state changes are predictable.
- [ ] Provide only the necessary parts of the store via context to components.

## Artifacts
- `src/core/store.js` (new)

## Memory / Current State
- Multiple state services identified.
- Next step: Design the shape of the global state object.
