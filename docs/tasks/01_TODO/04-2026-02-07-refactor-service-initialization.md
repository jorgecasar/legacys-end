# Refactor Service Initialization <!-- id: 2026-02-07-refactor-service-initialization -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
`LegacysEndApp.js` is currently acting as a "God Object" for service initialization. It instantiates, configures, and provides over a dozen services and controllers in its `initGame` method. This makes it hard to test, maintain, and reason about.

The goal is to move this logic to a dedicated `AppInitializer` or `BootstrapService` that can be easily tested in isolation.

## Plan
- [ ] Create `src/services/bootstrap-service.js` to handle orchestration of service creation.
- [ ] Define a clear initialization sequence (Core -> API -> App -> Game State -> Controllers).
- [ ] Refactor `LegacysEndApp` to use the new bootstrap service.
- [ ] Add unit tests for `BootstrapService` to verify the correct order and handling of failures.
- [ ] (Optional) Implement an "Initializable" interface/pattern for services that need async setup.

## Artifacts
- `src/components/legacys-end-app/LegacysEndApp.js`
- `src/services/bootstrap-service.js`

## Memory / Current State
- Identified the issue in `LegacysEndApp.js`.
- Plan drafted.
- Next step: Create the `BootstrapService`.
