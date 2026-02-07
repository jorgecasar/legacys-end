# Dependency Analysis and Cleanup <!-- id: 2026-02-07-dependency-analysis-and-cleanup -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
Over time, projects accumulate unused dependencies or circular imports. We have `dependency-cruiser` in `devDependencies` but it's not currently used in the build process or for regular audits.

## Plan
- [ ] Configure `dependency-cruiser` (create `.dependency-cruiser.js` if missing).
- [ ] Run an audit to identify circular dependencies.
- [ ] Identify and remove any unused `npm` packages.
- [ ] Add a `lint:deps` script to `package.json`.
- [ ] Check for "dead code" (files that are never imported).

## Artifacts
- `package.json`
- `.dependency-cruiser.js`

## Memory / Current State
- `dependency-cruiser` is installed.
- Next step: Run `npx depcruise src --output-type err-long`.
