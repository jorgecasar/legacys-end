<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Legacy's End - Developer Resume Game

A comprehensive RPG-style resume application built with Lit Web Components. It demonstrates modern web development practices including Clean Architecture, reactive state management, and component-driven design.

## 🏗️ Architecture

The project has recently undergone major architectural refactoring (Phase 7) to align with **SOLID principles** and **Clean Architecture**.

### Key Concepts

*   **Event-Driven Architecture**: Controllers (`Quest`, `Interaction`, `GameZone`) are fully decoupled from consumers, emitting events via a global `EventBus` instead of direct callbacks.
*   **Dependency Injection**: Core services and controllers are injected via `IGameContext`, decoupling them from the main application shell.
*   **Command Pattern**: Game actions (Move, Interact, Pause) are encapsulated as Commands in a Command Bus, enabling replayability and macro recording.
*   **Use Cases**: Complex domain logic (e.g., `EvaluateChapterTransition`, `ProcessGameZoneInteraction`) is extracted into pure, testable Use Cases.
*   **State Management**: A reactive `GameStateService` serves as the single source of truth, synchronizing UI across components.
*   **Web Components**: UI is built with Lit (lightweight, standard-based web components).

### Directory Structure

*   `src/use-cases/`: Pure business logic (e.g., Chapter Transitions, Zone Interactions).
*   `src/commands/`: Action objects for the Command Bus.
*   `src/controllers/`: Reactive controllers linking UI to logic.
*   `src/services/`: Core infrastructure (Progress, Storage, Audio).
*   `src/components/`: Lit components (Game View, HUD, Dialogs).
*   `src/setup/`: Dependency injection wiring and initialization.
*   `src/constants/`: Shared constants, including `EVENTS`.

## 🚀 Run Locally

**Prerequisites:** Node.js

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the app:**
    ```bash
    npm run dev
    ```
    Currently running at http://localhost:8000 (default)

## 🧪 Testing

The project maintains a high standard of code quality with **550+ tests** passing.

*   **Run all tests:** `npm run test`
*   **Lint code:** `npm run lint`

## 🛠 Recent Refactors (Phases 6 - 8)

*   **Event-Driven**: Complete migration to event-driven controllers for Quest, Zones, and Interaction.
*   **Decoupled Architecture**: `GameView` no longer depends on `LegacysEndApp`.
*   **Logic Extraction**: Zone detection and quest progression logic moved to Use Cases.
*   **Bug Fixes**: Resolved Hero Name display and Dialog interaction issues.
