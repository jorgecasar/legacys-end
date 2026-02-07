# Implement Quest Data Validation <!-- id: 2026-02-07-quest-validation -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
Quest data is currently trusted as-is. Malformed quest or chapter definitions can cause runtime crashes that are hard to debug.

## Plan
- [ ] Define a clear schema for Quest and Chapter objects.
- [ ] Implement a validation step in `QuestRegistryService` before a quest is loaded into the state.
- [ ] Add descriptive error messages for missing required fields (e.g., "Chapter X is missing exitZone").
- [ ] Add unit tests with "broken" quest data to ensure the validator catches them.

## Artifacts
- `src/services/quest-registry-service.js`
- `src/utils/validators.js`

## Memory / Current State
- Basic validators exist but aren't used for quest integrity.
- Next step: Define the Quest schema.
