# Legacy's End - Master Project Report

## 1. Executive Summary

**Legacy's End** is a gamified educational web application designed to teach modern frontend architecture principles through an RPG-style interface. Players guide a character ("Alarion") through various "Quests" that represent technical challenges, transforming a "legacy" codebase into a modern, clean architecture.

The project is built using **Lit** (Web Components) and **Vite**, leveraging a Domain-Driven Service architecture with fine-grained reactivity via **Signals**.

---

## 2. Technical Architecture

### 2.1 Tech Stack

*   **Core Framework**: [Lit 3.x](https://lit.dev/) (Web Components)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: JavaScript (ES Modules) with strict JSDoc typing
*   **UI Components**: [@awesome.me/webawesome](https://processed.awesome.me/docs)
*   **State Management**: Domain-Driven Signals (`@lit-labs/signals`)
*   **Dependency Injection**: `@lit/context`
*   **Testing**: Vitest (Unit/Browser) + Playwright (E2E)
*   **Linting/Formatting**: Biome

### 2.2 Directory Structure (`src/`)

| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable UI components organized by domain. |
| `constants/` | App-wide constants (Routes, Events). |
| `content/` | Game content definitions (Quests, Chapters). |
| `contexts/` | Lit Context definitions for dependency injection. |
| `controllers/` | Reactive controllers bridging services and UI. |
| `game/services/` | Domain-specific state services (Hero, Quest, World). |
| `services/` | Global infrastructure services (Theme, Progress, Session). |
| `use-cases/` | Pure business logic and domain rules. |
| `utils/` | Helper functions and shared utilities. |

### 2.3 Key Design Patterns

#### **Service-Controller-Component Triad**
The application strictly separates concerns:
1.  **Services** (`src/**/services/`): Singletons managing specific domains (e.g., `HeroStateService`). They expose reactive **Signals**.
2.  **Controllers** (`src/controllers/`): Bridges that hook into the Lit lifecycle to bridge UI events and Services.
3.  **Components** (`src/components/`): Visual representations that consume state via Context and use `SignalWatcher` for automatic updates.

#### **Inversion of Control (IoC)**
The app uses `@lit/context` to inject service interfaces. Components do not instantiate services; they request them, enabling high testability through "Fakes" and "Mocks".

#### **Reactive State Derivation**
The UI is a projection of the reactive state. Imperative DOM manipulation is forbidden in favor of signal-based updates (e.g., slide navigation is controlled by `WorldStateService`).

---

## 3. Core Systems Analysis

### 3.1 The Composition Root (`LegacysEndApp.js`)
The main entry point where the application is assembled.
*   **Responsibilities**:
    *   Bootstraps core services via `GameBootstrapper`.
    *   Provides context for all global and domain services.
    *   Handles top-level routing between the Hub and Gameplay.

### 3.2 Game Engine (`GameViewport.js`)
The active engine responsible for the "World" interaction.
*   **Orchestration**: Manages `CollisionController`, `InteractionController`, and `GameZoneController`.
*   **Rendering**: Translates domain signals into visual animations and state.

### 3.3 Domain Services
*   **HeroStateService**: Tracks position, evolution status, and visual effects.
*   **QuestStateService**: Manages chapter progression and level-specific goals.
*   **WorldStateService**: Controls engine-level flags like pause and narrative dialogs.

### 3.4 Persistence
*   **ProgressService**: Manages long-term data (completed quests, achievements) using a pluggable `StorageAdapter`.

---

## 4. Content & "Saga" Structure

The content is organized into "Quests", each representing a Chapter of the Saga.

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

---

## 5. Development Standards

### 5.1 Quality Enforcement
*   **100% Coverage**: Mandatory for all service logic.
*   **Strict Typing**: Checked via `tsc --noEmit` and JSDoc.
*   **Linting**: Enforced via Biome and Lit-Analyzer.

### 5.2 Component Pattern (4-File)
1.  **Logic** (`.js`): Class definition only.
2.  **Styles** (`.styles.js`): CSS exports.
3.  **Definition** (`.js`): Registration side-effect.
4.  **Test** (`.spec.js`): Browser-mode interaction tests.