# Standardize Error Handling with Result Pattern <!-- id: 2026-02-07-standardize-error-handling -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The project uses `try-catch` blocks inconsistently. To improve scalability, we should treat errors as first-class citizens using the `Result` pattern.

## Plan
- [ ] Refactor all Use Cases to return a `Result` object (Success or Failure).
- [ ] Update Controllers to handle these results and update the UI/State accordingly.
- [ ] Remove generic `try-catch` blocks that just log errors without recovery.
- [ ] Create a centralized `ErrorMapper` to convert internal errors into user-friendly messages (localized).

## Artifacts
- `src/utils/result.js`
- `src/use-cases/`

## Memory / Current State
- `Result` utility exists but usage is limited.
- Next step: Refactor `EvaluateChapterTransition` to use `Result`.
