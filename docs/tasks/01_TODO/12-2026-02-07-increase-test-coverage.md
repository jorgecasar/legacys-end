# Increase Test Coverage for Core Services and Controllers <!-- id: 2026-02-07-increase-test-coverage -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
Current test coverage is around 70%. Several critical files have low or zero coverage, particularly:
- `DialogueGenerationService` (0%)
- `touch-controller.js` (~30%)
- `voice-controller.js` (~39%)
- `LegacysEndApp.js` (logic within the component)

## Plan
- [ ] Write unit tests for `DialogueGenerationService`.
- [ ] Write unit tests for `touch-controller.js` (mocking touch events).
- [ ] Write comprehensive unit tests for `voice-controller.js` (mocking SpeechRecognition).
- [ ] Increase branch coverage for `QuestController`.
- [ ] Target >80% overall project coverage.

## Artifacts
- `vitest.config.js` (inferred from package.json/vite.config.js)
- `src/**/*.test.js`

## Memory / Current State
- Coverage report analyzed.
- Next step: Create `src/services/dialogue-generation-service.test.js`.
