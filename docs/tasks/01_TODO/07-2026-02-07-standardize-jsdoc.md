# Standardize JSDoc and Type Definitions <!-- id: 2026-02-07-standardize-jsdoc -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The project will remain in JavaScript to avoid an extra compilation step, but we want to maintain high type safety. Currently, there's a mix of inline JSDoc and external `.d.ts` files. We need to unify this pattern.

## Plan
- [ ] Audit all services and ensure they have complete `@param` and `@returns` documentation.
- [ ] Move shared interfaces from `.d.ts` files to a centralized `src/types` directory if they aren't already.
- [ ] Use `@typedef` to define complex objects within the relevant files.
- [ ] Ensure all Lit components have proper property and event typing via JSDoc.
- [ ] Configure `checkJs: true` in `jsconfig.json` (or `tsconfig.json`) to catch type errors in JS files during development.

## Artifacts
- `src/types/*.d.js`
- `tsconfig.json` / `jsconfig.json`

## Memory / Current State
- TypeScript migration rejected by the user.
- Decision: Use JSDoc for type safety.
- Next step: Audit `src/services/storage-service.js` for JSDoc completeness.
