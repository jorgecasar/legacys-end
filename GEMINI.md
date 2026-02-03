# GEMINI - Legacy's End Context

Educational game platform designed to teach clean frontend architecture, portability, and maintainability.

## Project Overview
- **Purpose**: Interactive quest-based learning for frontend developers.
- **Tech Stack**:
  - **Framework**: Lit (Web Components)
  - **Reactivity**: `@lit-labs/signals` (Fine-grained state management).
  - **Dependency Injection**: `@lit/context`.
  - **UI Library**: WebAwesome (Shoelace-based components).
  - **Tooling**: Vite (Build), Biome (Lint/Format), TypeScript (via JSDoc/TSC).
  - **Testing**: Vitest (Unit/Integration), Playwright (E2E/Visual Regression).
  - **Localization**: `@lit/localize` (Supports `en`, `es`).

## Core Architecture
Following a **Strict 3-Layer Structure**:
1.  **Application Layer (`legacys-end-app`)**: Handles routing and global service provision (`Theme`, `Progress`, `Localization`).
2.  **Quest View Layer (`quest-view`)**: Manages quest-specific parameters and provides domain contexts.
3.  **Engine Layer (`game-viewport`)**: Orchestrates reactive controllers (`Collision`, `Interaction`, `QuestFlow`).

### Component Standards
- **4-File Architecture**:
  - `ComponentName.js`: Logic and template.
  - `ComponentName.styles.js`: Encapsulated CSS.
  - `component-name.js`: Custom element definition.
  - `ComponentName.spec.js`: Tests.
- **Reactive State**: Use **Signals** for volatile state (positions, UI flags) and **ProgressService** for persistent state.
- **Typing**: Strict JSDoc typing is mandatory. No `any` allowed.

## Building and Running
- **Development**: `npm run dev` (Starts Vite on port 3000).
- **Production Build**: `npm run build` (Builds to `dist/`).
- **Preview**: `npm run preview`.
- **Linting**: `npm run lint` (Runs Biome, Lit-analyzer, TSC, and Dependency Cruiser).
- **Unit Tests**: `npm run test` (Vitest).
- **E2E Tests**: `npm run test:e2e` (Playwright).
- **Update Snapshots**: `npm run test:e2e:update`.

## Development Conventions
- **Atomic Commits**: Commits must be small and focused.
- **Traceability**: Commits must include a reference to a task in `docs/tasks/` (e.g., `Task: #2026-02-03-refactor-dialog`).
- **ADRs**: Significant architectural changes require an ADR in `docs/adr/`.
- **Localization**: Use `msg()` for all user-facing strings. Run `npm run localize:extract` after adding new strings.
- **Agent Workflow**:
  1. Understand via `docs/ARCHITECTURE.md` and `docs/PROJECT_STANDARDS.md`.
  2. Implement changes following the 4-file component pattern.
  3. Verify via `verify-changes` skill (Lint, TSC, Tests).
  4. Document findings and update tasks.

## Key Directories
- `src/components/`: Modular Lit components.
- `src/controllers/`: Shared reactive logic (Controllers).
- `src/game/services/`: Domain-specific state services.
- `src/services/`: Global infrastructure services.
- `docs/tasks/`: File-based Kanban system.
- `e2e/`: Playwright visual regression tests.
