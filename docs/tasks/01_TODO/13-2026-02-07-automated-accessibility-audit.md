# Automated Accessibility Audit <!-- id: 2026-02-07-automated-accessibility-audit -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The project uses custom pixel-art CSS and third-party components (Web Awesome). We need to ensure the application is accessible (WCAG 2.1 AA) and that we don't introduce regressions.

## Plan
- [ ] Integrate `@axe-core/playwright` into the existing E2E journey tests.
- [ ] Add an accessibility test suite that scans all main views (Hub, Viewport, Dialogs).
- [ ] Configure `@storybook/addon-a11y` to run in CI if possible, or at least ensure it's used during development.
- [ ] Fix any high/critical violations found during the initial run.
- [ ] Audit "pixel.css" for color contrast and text scaling.

## Artifacts
- `e2e/journey.spec.js`
- `src/pixel.css`
- `.github/workflows/pr-validation.yml`

## Memory / Current State
- `axe-core` is already in `devDependencies`.
- Next step: Update Playwright tests to include `axe` scans.
