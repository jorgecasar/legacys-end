# Standardize Type Definitions <!-- id: 2026-02-06-standardize-types -->

> **Status**: Doing
> **Created**: 2026-02-06
> **Last Updated**: 2026-02-06

## Context & Goal
Standardize all type definitions to use `.d.js` extension, eliminate barrel files (`interfaces.js`), and enrich documentation to improve type safety and developer experience.

## Plan
- [x] Rename `.js` types to `.d.js`
- [x] Eliminate `src/services/interfaces.js` and `src/game/interfaces.js`
- [x] Consolidate common types in `common.d.js`
- [x] Enrich JSDoc documentation
- [x] Verify with lint and tests

## Memory / Current State
Refactoring complete and verified. Ready to merge.
