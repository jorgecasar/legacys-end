# Enhance PWA Features <!-- id: 2026-02-07-enhance-pwa-features -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The project has a basic `sw.js` but it could be much more robust to support a "Game" feel (offline support, faster loading, "Add to Home Screen" prompts).

## Plan
- [ ] Create a proper `manifest.json` with app icons and theme colors.
- [ ] Implement a "New Version Available" prompt using the Service Worker.
- [ ] Optimize the caching strategy for quest assets (prefetch next chapter assets).
- [ ] Add offline support for previously played quests.

## Artifacts
- `public/sw.js`
- `public/manifest.json` (new)
- `index.html`

## Memory / Current State
- Basic `sw.js` exists.
- Next step: Create `manifest.json`.
