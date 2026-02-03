<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Legacy's End - Developer Resume Game

A comprehensive RPG-style resume application built with Lit Web Components. It demonstrates modern web development practices including Clean Architecture, reactive state management, and component-driven design.

## 🏗️ Architecture

The project follows **SOLID principles** and **Clean Architecture**, with a focus on decoupling, reactivity, and type safety.

### Key Concepts

*   **Context-Based Dependency Injection**: Services and controllers are injected via `@lit/context`, eliminating prop-drilling and decoupling components from concrete implementations.
*   **Domain-Driven State**: Application state is split into focused domain services (`HeroStateService`, `QuestStateService`, `WorldStateService`) instead of a single monolith.
*   **Reactive Signals**: Uses **Lit Signals** (`@lit-labs/signals`) for high-performance, fine-grained reactivity. Components only re-render when the specific signals they consume are updated.
*   **Use Cases**: Complex business rules (e.g., `EvaluateChapterTransition`, `InteractWithNpc`) are encapsulated in pure, stateless Use Case classes.
*   **Reactive Controllers**: Bridging logic between domain services and UI components is handled by specialized Lit Reactive Controllers.
*   **Web Components**: UI is built with Lit, following a strict 4-file architecture pattern (Logic, Styles, Definition, Test).

### Directory Structure

*   `src/game/services/`: Domain-specific state services (Hero, Quest, World).
*   `src/services/`: Global infrastructure services (Theme, Progress, Session).
*   `src/controllers/`: Reactive controllers linking UI to logic.
*   `src/use-cases/`: Pure business logic and domain rules.
*   `src/components/`: Lit components organized by domain.
*   `src/contexts/`: Lit context definitions for dependency injection.
*   `src/utils/`: Shared utilities and helpers.

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

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

The project maintains a high standard of code quality with comprehensive test coverage.

*   **Run all tests:** `npm run test`
*   **Run with coverage:** `npm run test:coverage`
*   **Lint code:** `npm run lint`
*   **Type check:** `npm run lint:tsc`

## 🛠 Recent Refactors

### Phase 11: Domain-Driven Refactor & Context DI (February 2026)

Major architectural shift to a modern, decoupled structure:

*   🚀 **Decomposed GameState monolith** into domain-specific services (`Hero`, `Quest`, `World`).
*   🔒 **Migrated to @lit/context** for service injection, removing legacy instantiation patterns.
*   🧹 **Removed EventBus and CommandBus** in favor of direct service calls and reactive signals.
*   🧪 **Hardened Type Safety** using JSDoc and strict TSC configuration.
*   ✨ **Standardized Decorators** using TC39 standard decorators (`accessor` keyword).

### Phase 10: Code Quality & Encapsulation (January 2026)

Focused on improving component-level encapsulation and reducing duplication:
- 🔒 **23 event handlers** converted to private methods (#)
- 🧩 **8 helper methods** extracted for reusability
- 📉 **~245 lines** of duplicate code eliminated
- 📝 **Consistent logging** with `LoggerService` (removed raw console logs)

## 📚 Documentation

*   [Project Standards](docs/PROJECT_STANDARDS.md) - Coding standards and guidelines
*   [Architecture Overview](docs/ARCHITECTURE.md) - High-level system design
*   [Technical Reference](docs/TECHNICAL_REFERENCE.md) - Detailed module documentation
*   [i18n Technical Glossary](docs/I18N_GLOSSARY.md) - Translation standards


## 🤝 Contributing

Please read [PROJECT_STANDARDS.md](docs/PROJECT_STANDARDS.md) before contributing. All code must:
- Follow the 4-file component architecture
- Include comprehensive tests (80%+ coverage)
- Use JSDoc for all public APIs
- Pass all linters (Biome, TSC)
- Use private methods (#) for internal logic

## 📄 License

This project is part of a developer portfolio.
