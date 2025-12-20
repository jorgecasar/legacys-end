# Legacy's End - Technical Reference

This document provides a detailed reference for the core modules of the project: Services, Managers, Controllers, Components, and Mixins.

---

## 🧠 Architectural Decisions & Patterns

### 1. Observable Services Pattern
**Question**: Why does `GameStateService` (and others) extend `Observable`?

**Reasoning**:
In standard Lit applications, state is usually managed within components using reactive properties. However, in a game engine, state often needs to be accessed and modified by purely logical entities (Managers, Controllers) that are *not* UI components.

*   **Decoupling Logic from UI**: `GameStateService` can run game logic, update coordinates, or handle inventory without needing a DOM element.
*   **Reactivity Bridge**: By extending `Observable`, the service becomes a reactive data source. UI components (like `LegacysEndApp`) subscribe to the service. When the service calls `notify()`, the component requests a re-render.
*   **Multiple Consumers**: A single state change (e.g., "Item Collected") can simultaneously update the HUD, trigger a sound effect manager, and notify the Quest Controller, without these systems knowing about each other.

### 2. Dependency Injection (DI) via Context
**Pattern**: Usage of `@lit/context` and a simple Services Object.

**Reasoning**:
To avoid "Prop Drilling" (passing data through many layers of components), we use Lit Context to provide global instances of Services and State to any component in the tree. Services are instantiated once in `src/setup/services.js` and exposed via `LegacysEndApp`.

### 3. Service-Controller-Component Triad
**Pattern**: Strict separation of concerns.

*   **Service**: "Source of Truth". Holds data and business logic (e.g., `GameStateService`).
*   **Controller**: "Brain". Reactive Controllers that hook into the component lifecycle to bridge services and UI (e.g., `KeyboardController`).
*   **Component**: "View". Purely visual representation of the state (e.g., `GameViewport`).

### 4. Alternative Considered: Services as Lit Controllers?
**Question**: Why not implement `GameStateService` directly as a [Lit Reactive Controller](https://lit.dev/docs/composition/controllers/)?

**Reasoning**:
Lit Controllers are powerful but are designed to be **bound to a specific host component's lifecycle**.
*   **Lifecycle Limitations**: A Controller is instantiated by a component (`new Controller(this)`). If we moved the `GameState` logic entirely into a Controller, every component would have its own isolated instance of the state, or we would still need a singleton backing store.
*   **Non-UI Logic**: Our architecture has `Managers` (like `GameSessionManager`) that need to manipulate state but are **pure JavaScript classes**, not Lit Components. They cannot "host" a Lit Controller.
*   **Architecture Choice**: We use **Services** for *singletons* that exist independently of the UI (Data Layer), and **Controllers** for logic that *must* interact with the Component Lifecycle (Inputs, Timers, View Bindings).

### 5. Future Considerations: Signals Implementation
**Question**: Could we use [Signals](https://lit.dev/docs/data/signals/) instead of `Observable`?

**Viability / Recommendation**:
**YES.** Migrating to Signals is a highly recommended path for future refactoring.

*   **Comparison**:
    *   **Current (`Observable`)**: "Coarse-grained" reactivity. When `notify()` is called, the *entire* subscribing component re-renders. Requires manual subscription cleanup.
    *   **Signals**: "Fine-grained" reactivity. Only the specific parts of the DOM that depend on a signal will update. Dependencies are tracked automatically (no manual `subscribe`).

*   **Migration Strategy**:
    1.  **Dependencies**: Install `@lit-labs/signals` (or use the standard `Signal` polyfill).
    2.  **Service Layer**: Replace `Observable` base class. Properties like `heroPos` become `signal({x:0, y:0})`.
    3.  **UI Layer**: Use the `SignalWatcher` mixin on `LegacysEndApp`. Accessing `this.gameState.heroPos.value` would automatically trigger updates.

*   **Verdict**: Signals would simplify the codebase by removing the custom `Observable` boilerplate and improving rendering performance, but the current `Observable` pattern is robust enough for the current scale.

---

## 🏗️ Services (`src/services/`)

Services are pure logic classes that manage specific domains of the application state or business logic. They are often unrelated to the UI and can be injected or imported directly.

### `GameStateService`
**Purpose**: Manages the ephemeral state of the active gameplay session (hero position, UI flags, etc.).
**Type**: Observable (extends `Observable` utils).

*   **State Properties**:
    *   `heroPos`: `{x, y}` coordinates of the player.
    *   `hasCollectedItem`: Boolean, true if the level's objective item is collected.
    *   `isRewardCollected`: Boolean, true if the visual reward sequence is finished.
    *   `hotSwitchState`: `HotSwitchState` (`legacy` | `new` | `test` | `null`) indicating the current API context (Level 6 mechanic).
    *   `isPaused`: Boolean, game pause state.
    *   `themeMode`: `ThemeMode` (`light` | `dark`), visual theme.

*   **Key Methods**:
    *   `getState()`: Returns a snapshot of the current state.
    *   `setHeroPosition(x, y)`: Updates player coordinates.
    *   `resetChapterState()`: Resets ephemeral flags (items, messages) for a new chapter.

### `ProgressService`
**Purpose**: Manages long-term player progression and persistence.
**Dependencies**: `StorageAdapter` (defaults to localStorage), `QuestRegistry`.

*   **State Tracks (`ProgressState`)**:
    *   `completedQuests`: Array of quest IDs.
    *   `completedChapters`: Array of chapter IDs.
    *   `unlockedQuests`: Quests available to play.
    *   `achievements`: Earned badges.
    *   `stats`: Aggregate metrics (`totalPlayTime`, `questsCompleted`).
    *   `currentQuest` / `currentChapter`: Active session pointers.

*   **Key Methods**:
    *   `loadProgress() / saveProgress()`: Handles persistence.
    *   `completeChapter(chapterId)`: Marks a chapter as done.
    *   `completeQuest(questId)`: Marks a quest as done and unlocks subsequent content.
    *   `getQuestProgress(questId)`: Returns a percentage (0-100).
    *   `resetProgress()`: Wipes all user data (for testing/reset).

### `LoggerService`
**Purpose**: Centralized logging utility with log levels (`debug`, `info`, `warn`, `error`).
**Usage**: Import singleton `logger`.

### `StorageService`
**Purpose**: Abstract interface for data persistence.
**Implementations**:
*   `LocalStorageAdapter`: Wraps browser `localStorage` with JSON parsing and error handling.


### `UserServices` (`LegacyUserService`, `MockUserService`, `NewUserService`)
**Purpose**: Mock implementations of a backend user API, used to demonstrate the "Strategy Pattern" and dependency injection in gameplay (Level 6).
**Interface (`IUserService`)**:
*   `fetchUserData(id)`: Returns `Promise<UserData>`.
*   `getServiceName()`: Returns `ServiceType` (`legacy`, `mock`, `new`).
**Context**:
*   `ServiceType` Enum: Defines the available service modes.
*   Used by `ServiceController` to switch implementations dynamically (polymorphism).

---

## ⚙️ Managers (`src/managers/`)

Managers are high-level coordinators that orchestrate logic between multiple services and controllers.

### `GameSessionManager`
**Purpose**: The central "brain" of the running game session. It bridges the gap between the `QuestController` (logic) and the `GameStateService` (data).

*   **Responsibilities**:
    *   Orchestrates Quest Start/End lifecycles.
    *   Handles navigation requests (Route -> Quest).
    *   Manages "Auto-Move" logic (clicking to move).
    *   Coordinates level transitions (evolutions).
*   **Key Methods**:
    *   `startQuest(questId)`: Initializes a quest.
    *   `returnToHub()`: Cleans up quest state and redirects to Hub.
    *   `handleMove(dx, dy)`: Processes movement inputs and collision.
    *   `triggerLevelTransition()`: Plays the "Evolution" animation and advances the chapter.

---

## 🎮 Controllers (`src/controllers/`)

Controllers are specialized classes (often using Lit's Reactive Controller pattern) that handle specific functional aspects of the application.

### `QuestController`
**Purpose**: Manages the specific logic of Quest progression (chapters, prerequisites, completion).
**Type**: Lit Reactive Controller.
**Inputs**:
*   `QuestControllerOptions`: Callbacks for quest/chapter events and progress service.
**Outputs**:
*   `onQuestStart(quest)`: Triggered when a quest starts.
*   `onChapterChange(chapter, index)`: Triggered when chapter changes.
*   `onQuestComplete(quest)`: Triggered when quest completes.
*   `onReturnToHub()`: Triggered when returning to hub.
**Key Methods**:
*   `startQuest(questId)`: Starts a new quest from the beginning.
*   `continueQuest(questId)`: Resumes from the first uncompleted chapter.
*   `jumpToChapter(chapterId)`: Navigates to a specific chapter (with validation).
*   `completeChapter()`: Marks current chapter as done and advances.
*   `completeQuest()`: Marks quest as completed.

### `KeyboardController`
**Purpose**: Handles keyboard input (WASD, Arrows, Space, Escape).
**Type**: Lit Reactive Controller.
**Inputs**:
*   `KeyboardOptions`: Callbacks for movement, interaction, and pause.
*   Keyboard events (WASD, Arrow keys, Space, Escape).
**Outputs**:
*   `onMove(dx, dy)`: Triggered on movement keys.
*   `onInteract()`: Triggered on Space key.
*   `onPause()`: Triggered on Escape key.
**Key Logic**:
*   **Escape**: Always triggers pause, even when input is disabled.
*   **isEnabled check**: Blocks movement and interaction when disabled (e.g., during dialogs).
*   **Prevents default**: Stops browser scrolling on arrow keys.

### `InteractionController`
**Purpose**: Detects proximity to NPCs and handles "Interact" actions.
**Type**: Lit Reactive Controller.
**Inputs**:
*   `handleInteract()`: Called on user input (e.g., Spacebar).
*   `InteractionOptions`: Callbacks for game state access and UI triggers.
**Outputs**:
*   `onShowDialog()`: Opens the dialog UI.
*   `onLocked(msg)`: Triggers a "locked" feedback message (e.g., "REQ: NEW API").
**Key Logic**:
*   **Proximity**: Hero must be within `interactionDistance` (default 15) of the NPC.
*   **Final Boss**: Special logic blocks interaction if `hotSwitchState` is 'legacy' (requires 'new' context).

### `CollisionController`
**Purpose**: Handles AABB (Axis-Aligned Bounding Box) collision detection.
**Type**: Lit Reactive Controller.
**Inputs**:
*   `checkExitZone(x, y, exitZone, collected)`: `exitZone` must match `{x, y, width, height}` (`Box` type).
**Outputs**:
*   Triggers `onExitCollision` callback when conditions are met.
**Key Logic**:
*   `checkExitZone()`: Determines if the player has entered the level exit area (only active if item is collected).
*   `checkAABB(box1, box2)`: Generic collision utility.

### `GameZoneController`
**Purpose**: Detects special zones within a level based on player position.
**Type**: Lit Reactive Controller.
**Inputs**:
*   `checkZones(x, y)`: Player position (0-100%).
*   `GameZoneOptions`: Callbacks for state changes.
**Outputs**:
*   `onThemeChange(mode: ThemeMode)`: Triggers when crossing Y-thresholds (Level 2).
*   `onContextChange(state: HotSwitchState)`: Triggers when entering legacy/new zones (Level 6).
**Key Logic**:
*   **Theme Zones**: Switches between 'dark' (bottom) and 'light' (top) if `hasThemeZones` is active.
*   **Context Zones**: Switches API context (`legacy` vs `new`) based on X/Y quadrants.

### `ServiceController`
**Purpose**: Manages the loading of async data (simulated) from the active `UserService`.
**Type**: Lit Reactive Controller.
**Inputs**:
*   `ServiceControllerOptions`: Services map, profile provider, and callbacks.
*   `getActiveService(serviceType, hotSwitchState)`: Dynamic service selection.
**Outputs**:
*   `onDataLoaded(userData)`: Triggered when data loads successfully.
*   `onError(error)`: Triggered on loading errors.
**Key Logic**:
*   `loadUserData()`: Fetches data, handles loading/error states, and updates the `ProfileContext`.
*   **Dynamic Service Selection**: For `serviceType === "new"`, switches between legacy/new based on `hotSwitchState`.

### `CharacterContextController`
**Purpose**: Synchronizes the visual state of the character (sprites) with the game state context (Providers).
**Type**: Lit Reactive Controller.
**Inputs**:
*   `getState()`: Function returning current Level, Chapter Data, User Data, etc.
**Outputs**:
*   Updates the `CharacterContext` (Suit, Gear, Power, Mastery).
**Logic**:
*   **Suit/Gear**: Determines correct sprite based on Level Config and collected rewards.
*   **Power**: Applies glitch effects based on 'Hot Switch' state and API stability.
*   **Mastery**: Tracks character level progression.

### `VoiceController`
**Purpose**: Handles Web Speech API integration for voice commands.
**Features**:
*   Listens for commands ("move left", "interact", "next").
*   Uses `window.speechSynthesis` for feedback (Alarion's voice).
*   Optional integration with Chrome Built-in AI (Prompt API) for natural language processing.

### `DebugController`
**Purpose**: Exposes the `window.game` global API for debugging when `?debug` is present in the URL.
**Type**: Lit Reactive Controller.
**Inputs**:
*   `?debug` query parameter in URL.
*   `DebugOptions` callbacks (`setLevel`, `giveItem`, etc.).
**Outputs**:
*   `window.game` object with console commands.
*   Console logs for state inspection.

---

## 🧩 Components (`src/components/`)

Visual UI elements built with `Lit`.

### `GameView`
**Element**: `<game-view>`
**Purpose**: The main container for the active gameplay.
**State**: Renders `GameViewport`, `GameHud`, `PauseMenu`, and `LevelDialog`.

### `GameViewport`
**Element**: `<game-viewport>`
**Purpose**: The "World" canvas where the game is played.
**Responsibilities**:
*   Renders the Hero, NPCs, Rewards, and background.
*   Handles CSS-based animations (Hero movement, Reward collection sequence).

### `QuestHub`
**Element**: `<quest-hub>`
**Purpose**: The main menu screen listing available quests.
**Features**:
*   Grid of Quest Cards.
*   Coming Soon section.
*   Progress bars and badges.

### `LevelDialog`
**Element**: `<level-dialog>`
**Purpose**: The modal interface for storytelling and code challenges.
**Structure**:
*   **Slides**: Narrative -> Problem -> Code Analysis -> Confirmation.
*   **Interactive**: Displays syntax-highlighted code blocks.

### `HeroProfile`
**Element**: `<hero-profile>`
**Purpose**: Renders the player character sprite and nameplate.
**Features**:
*   Context-aware styling (glitch effects, shadows based on API context).
*   Composites multiple images (Suit + Gear + Power).

### `NpcElement` / `RewardElement`
**Elements**: `<npc-element>`, `<reward-element>`
**Purpose**: Simple absolute-positioned entities in the viewport.

### `VictoryScreen`
**Element**: `<victory-screen>`
**Purpose**: Full-screen overlay shown upon completing a Quest.

### `PauseMenu`
**Element**: `<pause-menu>`
**Purpose**: In-game menu for Resuming, Restarting, or Quitting to Hub.

---

## 🧪 Mixins (`src/mixins/`)

### `ContextMixin`
**Purpose**: Sets up the root-level Lit Context Providers.
**Usage**: Applied to the main application shell (`LegacysEndApp`) to ensure contexts (`theme`, `profile`, `character`) are available globally.

---

## 🔌 Service Usage & Dependency Injection

### How Services are Consumed
Services are designed as **Singletons** and are primarily accessed via **Lit Context** (`@lit/context`). This ensures any component in the tree can access the service instance without prop drilling.

1.  **Instantiation**: Services are instantiated in `legacys-end-app.js` (Root Component).
2.  **Provision**: The Root Component uses `ContextMixin` and `@provide` decorators to make services available.
3.  **Consumption**: Child components use the `@consume` decorator to get the service instance.

### Access Pattern
```javascript
// 1. Define Context (context-mixin.js)
export const gameContext = createContext('game-state');

// 2. Provide (legacys-end-app.js)
@provide({ context: gameContext })
gameStateService = new GameStateService();

// 3. Consume & Subscribe (Any Component)
@consume({ context: gameContext })
gameStateService;

connectedCallback() {
  super.connectedCallback();
  // Services extend Observable, so we can subscribe to changes
  this.gameStateService.subscribe(this.onStateChange);
}
```

### Consumer Map
| Service | Consumers (Examples) | Usage |
| :--- | :--- | :--- |
| `GameStateService` | `GameView`, `GameViewport`, `GameHud` | Rendering UI, Hero movement, Theme changes. |
| `SessionManager` | `LegacysEndApp` | Controlling global flow (Home <-> Game). |
| `ProgressService` | `QuestController`, `QuestHub` | Saving/Loading progress, unlocking chapters. |
| `LoggerService` | `*` (Imported directly as util) | Debugging and logging throughout the app. |

### How to Include a Service in a New Component
To use an existing service (e.g., `GameStateService`) in a new component:

1.  **Import the Context**:
    ```javascript
    import { gameContext } from "../mixins/context-mixin.js";
    ```
2.  **Add the Consumer**:
    ```javascript
    import { consume } from "@lit/context";

    class MyNewComponent extends LitElement {
      @consume({ context: gameContext, subscribe: true })
      gameStateService;

      render() {
        return html`Hero is at: ${this.gameStateService.state.heroPos.x}`;
      }
    }
    ```
    *Note: If `subscribe: true` is not sufficient (because we use a custom Observable pattern), you may need to manually subscribe in `connectedCallback` and trigger `this.requestUpdate()`.*

---

## 🛠️ Shared Modules & Utilities

### `QuestRegistry` (`src/quests/quest-registry.js`)
**Purpose**: The central repository for all Quest definitions.
**Key Functions**:
*   `getQuest(id)`: Retrieves a specific quest configuration.
*   `getAllQuests()`: Returns all playable quests.
*   `isQuestLocked(id, completedQuests)`: Checks prerequisites against user progress.

### `GameConfig` (`src/constants/game-config.js`)
**Purpose**: Defines global constants and configuration values.
**Key Constants**:
*   `ANIMATION`: Timings for rewards and transitions.
*   `VIEWPORT.ZONES`: Coordinates for logic triggers (Legacy/New API zones, Dark Mode zones).

### `Asset Utilities` (`src/utils/process-assets.js`)
**Purpose**: helper functions to ensure correct asset loading across different environments using `import.meta.env.BASE_URL`.
**Key Functions**:
*   `processImagePath(path)`: Resolves image paths relative to the application root.
*   `processBackgroundStyle(styleString)`: Parses and corrects URLs within CSS background strings.
