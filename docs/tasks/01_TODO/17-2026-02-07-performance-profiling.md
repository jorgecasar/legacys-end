# Performance Profiling and Component Decomposition <!-- id: 2026-02-07-performance-profiling -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
`GameViewport.js` and `LegacysEndApp.js` are large files (500+ lines). This can lead to performance bottlenecks during rendering and makes maintenance difficult.

## Plan
- [ ] Profile the game using Chrome DevTools (Performance tab) to identify long tasks.
- [ ] Decompose `GameViewport.js` into smaller sub-components:
    - `WorldRenderer`
    - `EntityLayer`
    - `InteractionLayer`
- [ ] Optimize the `requestAnimationFrame` loop if applicable (or ensure Lit's reactive updates are optimized for high-frequency game state).
- [ ] Implement virtualization for large lists if the Hub grows.

## Artifacts
- `src/components/game-viewport/GameViewport.js`
- `src/components/legacys-end-app/LegacysEndApp.js`

## Memory / Current State
- Large components identified.
- Next step: Run initial performance audit.
