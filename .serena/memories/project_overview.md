# Project Overview: Legacy's End
RPG adventure game to learn clean architecture and refactoring.

## Tech Stack
- Frontend: Lit (Web Components)
- Build Tool: Vite
- Language: JavaScript (with TS for types)
- Linting/Formatting: Biome
- Testing: Vitest (unit), Playwright (E2E)
- State Management: @lit-labs/signals, @lit/context
- Automation: rulesync, GitHub Actions

## Codebase Structure
- `src/core`: Business logic / Domain entities.
- `src/use-cases`: Pure business logic.
- `src/services`: Infrastructure adapters (Storage, AI, etc.).
- `src/controllers`: Application logic orchestrating use cases.
- `src/components`: UI components (Lit).
- `docs/tasks`: File-based Kanban system.
