# Voice Controller Robustness <!-- id: 2026-02-07-voice-controller-robustness -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The `VoiceController` is a monolithic Lit controller that handles too many responsibilities (recognition, synthesis, AI, command processing). It also lacks robust error handling for common speech recognition issues (e.g., silence, "no-speech", "network").

## Plan
- [ ] Decompose `VoiceController` into smaller, focused controllers:
    - `VoiceRecognitionController`
    - `VoiceNarrationController`
- [ ] Extract `VoiceCommandProcessor` as a separate logic class/service.
- [ ] Add explicit error handling for all `SpeechRecognition` error codes.
- [ ] Improve user feedback when AI sessions fail to initialize (e.g., show a status indicator in the HUD).
- [ ] Provide `DialogueGenerationService` via context instead of manual instantiation.

## Artifacts
- `src/controllers/voice-controller.js`
- `src/services/dialogue-generation-service.js`

## Memory / Current State
- `VoiceController.js` reviewed.
- Next step: Create a plan for the decomposition.
