# Legacy's End - Master Project Report

## 1. Executive Summary

**Legacy's End** is a gamified educational web application designed to teach modern frontend architecture principles through an RPG-style interface. Players guide a character ("Alarion") through various "Quests" that represent technical challenges, transforming a "legacy" codebase into a modern, clean architecture.

The project is built using **Lit** (Web Components) and **Vite**, leveraging a custom service-based architecture to manage game state, progression, and quests.

---

## 2. Technical Architecture

### 2.1 Tech Stack

*   **Core Framework**: [Lit 3.x](https://lit.dev/) (Web Components)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: JavaScript (ES Modules) with JSDoc typing
*   **UI Components**: [@awesome.me/webawesome](https://processed.awesome.me/docs) (Shoelace successor)
*   **State Management**: Custom Observable Service Pattern + Lit Context
*   **Testing**: Vitest (Unit) + Playwright (E2E)
*   **Linting/Formatting**: Biome

### 2.2 Directory Structure (`src/`)

| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable UI components (HUD, Hub, Dialogs, etc.) |
| `constants/` | App-wide constants (Routes, Events) |
| `content/` | Static content assets (images, text) |
| `contexts/` | Lit Context definitions for dependency injection |
| `controllers/` | Logic handlers separated from UI (Input, Game Loop) |
| `services/` | Core business logic services (GameState, Progress, Logger) |
| `managers/` | Higher-level state coordinators (SessionManager) |
| `quests/` | Quest definitions and configuration logic |
| `mixins/` | Shared behavior for components (e.g., `ContextMixin`) |
| `setup/` | Initialization scripts for routes, services, and controllers |
| `utils/` | Helper functions (Router, Mapper) |

### 2.3 Key Design Patterns

#### **Service-Controller-Component Architecture**
The application avoids tight coupling by separating concerns:
1.  **Services** (`src/services/`): Pure logic classes managing specific domains (e.g., `GameStateService`, `ProgressService`). They use an observer pattern to notify subscribers of changes.
2.  **Controllers** (`src/controllers/`): Bridges between Components and Services. They handle user input and complex logic flows (e.g., `QuestController`, `KeyboardController`).
3.  **Components** (`src/components/`): Dumb UI elements that render state and dispatch events.

#### **Dependency Injection & Context**
The app uses `@lit/context` to provide services and data down the component tree without prop drilling. This is heavily used for checking "Capabilities" (permissions/upgrades obtained in the game).

#### **Quest System Engine**
The core progression engine is decoupled from the rendering.
*   **Quest Registry** (`src/quests/quest-registry.js`): The specific definition of all available content.
*   **QuestController**: Manages the state of the active quest, chapter progression, and completion logic.

---

## 3. Core Systems Analysis

### 3.1 The App Shell (`legacys-end-app.js`)
This is the main entry point and "God Component" that orchestrates the application.
*   **Responsibilities**:
    *   Initializes Services, Routes, and Controllers.
    *   Manages top-level state synchronization (`syncState`).
    *   Handles routing between the **Hub** and the **Game View**.
    *   Applies global themes (`applyTheme`).

### 3.2 The Game Loop & Rendering
*   **GameView** (`src/components/game-view.js`): The primary canvas/renderer for the levels. It receives a mapped `gameState` object.
*   **GameStateMapper** (`src/utils/game-state-mapper.js`): Transforms raw service state into a format suitable for the `GameView`, ensuring the view receives only what it needs.

### 3.3 State Management
The project uses a custom reactive system:
*   **Services** extend `Observable`: Components subscribe to them to auto-update.
*   `SessionManager` acts as the aggregate root for the current user session, coordinating between `GameStateService` (current level state) and `ProgressService` (long-term user progress).

### 3.4 Routing
A custom `Router` (`src/utils/router.js`) handles client-side navigation, primarily switching between the "Hub" view and specific "Quest" views.

---

## 4. Content & "Saga" Structure

The content is organized into "Quests", each representing a Chapter of the Saga (as detailed in `SAGA_ARCHITECTURE.md`).

| Quest ID | Title | Concept / Skill | Status |
|----------|-------|-----------------|--------|
| `the-aura-of-sovereignty` | The Aura of Sovereignty | Encapsulation & Shadow DOM | ✅ Playable |
| `the-chromatic-loom` | The Chromatic Loom | Design Tokens & Theming | 🚧 Coming Soon |
| `the-orb-of-inquiry` | The Orb of Inquiry | Dependency Injection (IoC) | 🚧 Coming Soon |
| `the-flowing-heartstone` | The Flowing Heartstone | State Management | 🚧 Coming Soon |
| `the-watchers-bastion` | The Watcher's Bastion | Auth & Security | 🚧 Coming Soon |
| `the-mirror-of-veracity` | The Mirror of Veracity | Testing & Verification | 🚧 Coming Soon |
| `the-crimson-altar` | The Crimson Altar | Error Handling | 🚧 Coming Soon |
| `the-scroll-of-tongues` | The Scroll of Tongues | i18n / Localization | 🚧 Coming Soon |

**Current status**: The framework is in place (Registry, Hub UI), but most content is marked as "Coming Soon".

---

## 5. Development Guide

### 5.1 Commands

*   `npm install`: Install dependencies.
*   `npm run dev`: Start local development server (Vite).
*   `npm run build`: Build for production.
*   `npm run lint`: Run Biome and Lit Analyzer.
*   `npm run test`: Run functionality tests (Vitest).

### 5.2 Adding a New Quest
To add a new quest (e.g., unlocking "The Chromatic Loom"):
1.  Navigate to `src/quests/the-chromatic-loom/`.
2.  Define the quest structure in `index.js`, including `chapters` and `prerequisites`.
3.  Ensure the quest is exported and registered in `src/quests/quest-registry.js`.
4.  Create level assets (backgrounds, dialogs) for the new chapters.
5.  Change status from `coming-soon` to `active` (or remove the status property).

### 5.3 Best Practices
*   **Naming**: Follow usages in `NAMES_AUDIT.md`.
*   **Components**: Create new UI elements in `src/components/`, extending `LitElement`.
*   **Styles**: Use `src/styles/shared.js` and `pixel.css` for consistency.
*   **Localization**: Wrap text in `msg()` from `@lit/localize`.
