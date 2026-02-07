# Decouple Components (Smart vs Dumb Pattern) <!-- id: 2026-02-07-decouple-components -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
Currently, components like `GameViewport` or `LevelDialog` consume multiple contexts directly, making them hard to reuse and test. We need to apply the Smart/Dumb component pattern.

## Plan
- [ ] Identify "Presentation" (Dumb) components and remove all `@consume` decorators.
- [ ] Presentation components should only use `@property` and `dispatchEvent`.
- [ ] Create or designate "Container" (Smart) components to handle context consumption and pass data down.
- [ ] Refactor `GameViewport` to be a pure renderer that receives the game state as a property.

## Artifacts
- `src/components/` (Separated into containers and presentation)

## Memory / Current State
- `GameViewport.js` is currently a prime candidate for decoupling.
- Next step: Audit `src/components` to categorize them.
