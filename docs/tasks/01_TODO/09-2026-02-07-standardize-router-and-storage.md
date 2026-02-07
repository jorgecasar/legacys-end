# Standardize Router and Storage <!-- id: 2026-02-07-standardize-router-and-storage -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The `Router` and `LocalStorageAdapter` are very basic implementations. They lack standard features like navigation guards, query param parsing, and robust error handling.

## Plan
- [ ] Improve `Router`:
    - Add navigation guards (beforeEach hooks).
    - Add query parameter parsing.
    - Add a `currentRoute` signal.
- [ ] Improve `LocalStorageAdapter`:
    - Add key prefixing/namespacing.
    - Add `hasItem` method.
    - Handle `QuotaExceededError`.
- [ ] Add comprehensive unit tests for both utilities.

## Artifacts
- `src/utils/router.js`
- `src/services/storage-service.js`

## Memory / Current State
- Utilities reviewed.
- Next step: Draft the API for the improved Router.
