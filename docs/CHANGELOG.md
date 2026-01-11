# Changelog - Recent Updates

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
