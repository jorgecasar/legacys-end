# Optimize CI/CD Pipeline <!-- id: 2026-02-07-optimize-ci-cd-pipeline -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The current CI/CD pipelines (`deploy.yml`, `pr-validation.yml`) are functional but basic. They lack advanced features like artifact retention for failed tests, caching for `node_modules` and Playwright browsers to speed up runs, and integration with the new accessibility audit.

## Plan
- [ ] Implement caching for `npm` dependencies in all workflows.
- [ ] Implement caching for Playwright browsers.
- [ ] Add an "Artifacts" step to upload Playwright report/traces on failure.
- [ ] Add a step to build and publish Storybook as a static artifact on PRs (e.g., using Vercel Preview or GitHub Pages temporary branch).
- [ ] Ensure the new `axe` accessibility tests run as part of the PR validation.

## Artifacts
- `.github/workflows/deploy.yml`
- `.github/workflows/pr-validation.yml`

## Memory / Current State
- Workflows reviewed.
- Next step: Edit `pr-validation.yml`.
