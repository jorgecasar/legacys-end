# Project Overview: Legacy's End
RPG adventure game where players learn clean architecture and refactoring by saving a digital world.

## Tech Stack
- **Frontend**: Lit (Web Components), Web Awesome components.
- **Reactive State**: `@lit-labs/signals`, `@lit/context`.
- **Localization**: `@lit/localize`.
- **Tooling**: Biome (Linting/Formatting), Vite (Build/Dev), TypeScript (via JSDoc).
- **Testing**: Vitest (Unit/Integration), Playwright (E2E).
- **AI Integration**: Gemini API, custom autonomous agents for task management.

## Architectural Layers
1. **Domain (`src/core`)**: Pure business logic, entities, and core patterns (Result Pattern).
2. **Infrastructure (`src/services`)**: External adapters (Storage, AI, APIs).
3. **Application (`src/controllers`)**: Orchestration and UI state management.
4. **UI (`src/components`)**: Lit elements (Dumb components).

## Core Principles
- **Composition over Inheritance**.
- **Dependency Injection**: Via `@lit/context`.
- **Result Pattern**: Systematic error handling without exceptions in domain logic.
- **Dumb Components**: Receive properties, emit events, no direct context consumption.
