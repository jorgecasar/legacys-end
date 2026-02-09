# Project Summary: Legacy's End

**Legacy's End** is an RPG adventure game where the player (Alarion) fixes "Legacy Code" in a digital world. The project serves as both a game and a demonstration of clean coding practices.

## Architecture
The project follows a **Clean Architecture** pattern, separating concerns into strict layers:
1.  **Domain (src/use-cases)**: Pure business logic, independent of UI/Infra.
2.  **Infrastructure (src/services)**: Adapters for external systems.
3.  **Application (src/controllers)**: Orchestrates use cases and manages state.
4.  **UI (src/components)**: Dumb/Smart components using **Lit**.

## Key Directories
- `src/components`: UI Components (Lit)
- `src/use-cases`: Domain Logic
- `src/services`: Infrastructure/Services
- `src/content`: Game content/data
- `src/assets`: Static assets
