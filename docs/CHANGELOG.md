# Changelog - Recent Updates

## 2026-02-03 - Domain-Driven Refactor & Context DI (Phase 11)

### Architecture
- **GameState Monolith Decomposition**: Replaced the single `GameStateService` with specialized domain services: `HeroStateService`, `QuestStateService`, and `WorldStateService`.
- **Strict Context-Based DI**: Migrated from manual instantiation to `@lit/context` for all services. Root app (`LegacysEndApp`) now acts as the central provider.
- **Bus Removal**: Fully eliminated `EventBus` and `CommandBus`. Component communication now flows through direct service calls or reactive signals.
- **Standardized Decorators**: Adopted TC39 standard decorators (using `accessor` keyword) for all `@consume` and `@state` properties.

### Refactoring
- **Router Injection**: Refactored `Router` to accept a `LoggerService` instance, eliminating direct `console` dependencies.
- **Quest Lifecycle**: Integrated quest loading and orchestration directly into `QuestController`, removing the intermediate `QuestLoaderService`.
- **Error Handling**: Improved error propagation in `loadQuest`, ensuring failures are caught and handled at the controller level.
- **State Resets**: Ensured consistent UI state (dialogs, pause, slide index) when restarting quests or navigating between chapters.

### Documentation
- Overhauled `ARCHITECTURE.md`, `TECHNICAL_REFERENCE.md`, and `PROJECT_STANDARDS.md` to reflect the new decoupled structure.
- Updated `README.md` with current technical concepts and directory structure.

## 2026-01-12 - Data-Driven Zones & NPC Refactor

### Refactoring
- **Optimization**: Resolved Vite chunk loading warning by ensuring `QuestRegistryService` is dynamically imported and injected, improving code splitting.
- **Generic NPC Requirements**: Replaced hardcoded properties (`isFinalBoss`, `requiredContext`) with a generic `requirements` object in `NpcConfig`.
- **Configurable Messages**: NPC requirements now support custom error messages `{ value: any, message: string }`.
- **Zone Cleanup**: Fully removed legacy global constants (`GAME_CONFIG.VIEWPORT.ZONES`) and unused properties from `LevelConfig`.
- **Codebase Consistency**: Verified removal of all stale references, ensuring a truly data-driven architecture.

### Documentation
- Updated `QUEST_DESIGN.md` to reflect the new `requirements` structure for NPCs and the data-driven zone approach.

## 2026-01-11 - Logger Cleanup and Strict Dependency Injection

### Architecture
- **Strict Dependency Injection**: All Controllers (`GameController`, `VoiceController`) and Managers (`GameSessionManager`) now receive dependencies via constructor injection.
- **Removed Global State**: Eliminated global `logger` imports in business logic classes. The `logger` singleton is only imported in the composition root (`GameBootstrapper`).
- **Context Updates**: `IGameContext` now explicitly includes `logger`, exposed via `LegacysEndApp`.

### Refactoring
- **VoiceController**: Refactored to accept `logger` in options. Replaced `console.*` calls with `this.logger.*`.
- **GameController**: Refactored to accept `logger` in options.
- **GameSessionManager**: Removed fallback to global logger.

### Testing
- **Improved Isolation**: Unit tests now spy on the injected logger instance instead of the global `console` object, ensuring more reliable verification of logging behavior.
- **Coverage**: Maintained 100% test passing rate with updated mocks.

### Documentation
- **Quest Design**: Added "The Machine's Voice" (AI), "The Hot Switch" (API Patterns), and "The Time Dilator" (Performance) quests to `QUEST_DESIGN.md`.

## 2026-01-09 - State Management Refactor (Lit Signals)

### Core Refactoring
- **Lit Signals Integration**: Migrated `GameStateService` from a custom `Observable` pattern to `@lit-labs/signals`.
- **Fine-Grained Reactivity**: State properties (e.g., `heroPos`, `isPaused`) are now individual `Signal.State` instances, enabling more efficient UI updates.
- **Removed Observable Pattern**: Deleted `src/utils/observable.js` and removed `Observable` inheritance across the service layer.
- **Removed GameStateMapper**: Eliminated the need for intermediate state mapping as components now consume signals directly.

### Component Updates
- **SignalWatcher Adoption**: Refactored `LegacysEndApp` and other reactive components to use the `SignalWatcher` mixin.
- **Manual Subscription Removal**: Removed all `gameState.subscribe()` and `syncState()` boilerplate, as reactivity is now tracked automatically in `render()` methods.
- **Enforced Setters**: Replaced generic `setState()` with specific, validated setter methods (e.g., `setHeroPosition`, `setPaused`) to improve type safety and debugging.

### Testing and Quality
- **Test Mock Updates**: Refactored all unit tests in `PauseGameCommand` and `GameSessionManager` to use signal-based mocks.
- **TypeScript Compliance**: Refined JSDoc typedefs in `GameView` to fix visibility and access errors during final build.
- **Linting**: Achieved 100% compliance across Biome, Lit-Analyzer, and TSC.


## 2026-01-06 - Type System and HotSwitchState Refactoring

### Type System Improvements
- **Unified Quest Types**: Merged `Quest` and `EnrichedQuest` into a single `Quest` type composed of `QuestData` and `QuestProgress`
- **Mandatory Fields**: Enforced mandatory fields for better type safety:
  - `QuestData`: `description`, `icon`, `difficulty` are now required
  - `LevelConfig`: `problemTitle`, `problemDesc` are now required
  - `RewardConfig` and `NpcConfig`: `name` is now required
- **Geometric Types**: Introduced `Vector2`, `Size`, and `Rect` types for better spatial definitions
- **View-Specific Types**: Defined explicit view-specific state types in `game-state-mapper.js` for better decoupling

### HotSwitchState Architecture Changes
- **Default Value**: Changed from `"legacy"` to `null` across the application
  - `GameStateService` now initializes with `null`
  - `InteractionController` defaults to `null`
  - `HeroProfile` initializes with empty string `""`
- **Removed Automatic Assignment**: `GameSessionManager` no longer automatically sets `hotSwitchState` based on `serviceType`
- **Explicit State Management**: `hotSwitchState` now remains `null` unless explicitly set by:
  - Zone interactions (via `GameZoneController`)
  - User actions (manual switching)
- **Fallback Removal**: Removed `|| "legacy"` fallbacks from:
  - `game-viewport.js` hero-profile binding
  - `legacys-end-app.js` service selection
- **Styling Impact**: Empty or `null` `hotSwitchState` no longer applies `injection-*-api` classes

### Component Refactoring
- **LevelDialog Simplification**:
  - Removed `hotSwitchState` property
  - Removed "CONTROL CONSOLE" slide
  - Removed `isFinalBoss` conditional logic
  - Removed `dispatchToggleHotSwitch()` method
  - Simplified confirmation slide to always show "Level Complete!" with reward
  - Button text always shows "EVOLVE" instead of conditional "COMPLETE"/"EVOLVE"

### Testing Updates
- Updated all test mocks to reflect `null` as default `hotSwitchState`
- All tests passing (319 passed, 1 skipped)
- All lints passing (biome, lit-analyzer, tsc)

### Documentation Updates
- Updated `TECHNICAL_REFERENCE.md` to reflect:
  - New `hotSwitchState` default behavior
  - Removal of automatic assignment in `GameSessionManager`
  - Simplified `LevelDialog` structure
  - Updated `InteractionController` logic

## Impact
These changes improve the architecture by:
1. **Explicit State Management**: State is only set when needed, not by default
2. **Better Type Safety**: Mandatory fields prevent incomplete configurations
3. **Simplified Components**: Removed unnecessary conditional logic
4. **Clearer Intent**: `null` state clearly indicates "no active context" vs implicit "legacy"
