# Implement Visual Regression Testing <!-- id: 2026-02-07-visual-regression-testing -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
With a pixel-art aesthetic and complex UI overlays, visual regressions are easy to miss with unit tests alone.

## Plan
- [ ] Utilize Playwright's `expect(page).toHaveScreenshot()` in E2E tests.
- [ ] Create a "visual baseline" for all main game states:
    - Quest Hub
    - Game Viewport (with/without dialog)
    - Pause Menu
    - Victory Screen
- [ ] Add a visual regression suite to the CI pipeline.

## Artifacts
- `e2e/visual.spec.js` (new)
- `e2e/journey.spec.js-snapshots/`

## Memory / Current State
- Playwright is already installed and some snapshots exist.
- Next step: Expand coverage to all main components.
