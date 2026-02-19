# Service Refactoring Scope

This document lists the service files identified for refactoring, detailing their primary roles and exported classes.

## Services

| File Path                                       | Exported Classes                                     | Description                                                                 |
| ----------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/services/ai-service.js`                    | `AIService`                                          | Manages interaction with the Chrome Built-in AI (Prompt API).               |
| `src/services/bootstrap-service.js`             | `BootstrapService`                                   | Handles the initialization of all core services in the correct order.       |
| `src/services/dialogue-generation-service.js`   | `DialogueGenerationService`                          | Decouples AI dialogue generation from voice synthesis.                      |
| `src/services/localization-service.js`          | `LocalizationService`                                | Manages application locale and translation loading.                         |
| `src/services/logger-service.js`                | `LoggerService`                                      | Centralized logging with levels and structured output.                      |
| `src/services/preloader-service.js`             | `PreloaderService`                                   | Responsible for preloading assets to ensure smooth transitions.             |
| `src/services/progress-service.js`              | `ProgressService`                                    | Manages player progress and persistence.                                    |
| `src/services/quest-registry-service.js`        | `QuestRegistryService`                               | Business logic for quest management.                                        |
| `src/services/session-service.js`               | `SessionService`                                     | Manages application-level session state (loading, view mode).             |
| `src/services/theme-service.js`                 | `ThemeService`                                       | Manages the application-wide visual theme.                                  |
| `src/services/user-api-client.js`               | `LegacyUserApiClient`, `MockUserApiClient`, `NewUserApiClient` | Simulates different API responses for user data.                    |
| `src/services/voice-command-processor.js`       | `VoiceCommandProcessor`                              | Handles interpretation and execution of voice commands.                     |
| `src/services/voice-synthesis-service.js`       | `VoiceSynthesisService`                              | Wrapper for the Web Speech API for text-to-speech.                          |

