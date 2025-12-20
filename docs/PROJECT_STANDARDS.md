# Legacy's End - Project Standards & Guidelines

This document outlines the mandatory architectural and coding standards for "Legacy's End". All contributions must adhere to these rules to ensure consistency, maintainability, and quality.

---

## 1. Documentation Standards

### JSDoc & Typing
*   **Mandatory JSDoc**: All public methods and classes must have JSDoc comments.
*   **Type Definitions**: Complex objects (like State or Options) must be defined using `@typedef` at the top of the file so they can be exported and reused.
    ```javascript
    /**
     * @typedef {Object} GameState
     * @property {number} x
     * @property {number} y
     */
    ```
*   **No "Any"**: Avoid generic `Object` types where possible; define the shape.

---

## 2. Testing & Coverage

### Requirements
*   **Services**: Must have **100% Line Coverage**. Logic is critical here.
*   **Pull Requests**:
    *   **Patch Coverage**: New code must have at least **80% coverage**.
    *   **Project Coverage**: Must not drop by more than **1%**.
*   **Tooling**: Use `vitest` for unit tests. Run `npm run test:coverage` to verify locally.
*   **Environment**: Tests must not rely on global side-effects. Use dependency injection (e.g., passing `env` or `options` in constructors) to test different configurations.

---

## 3. Architecture Patterns

### Services vs. Controllers
*   **Services**: Are **Singletons**. They manage data and business logic independent of the UI.
    *   *Example*: `GameStateService`, `LoggerService`.
    *   *Pattern*: Extend `Observable` (currently) or `Signal` (future).
*   **Controllers**: Are **UI Helpers**. They interact with the DOM/Lit Lifecycle.
    *   *Example*: `KeyboardController`.
    *   *Rule*: Do not put global state in a Controller.

### Dependency Injection
*   Use **Lit Context** (`@lit/context`) to provide Services to Components.
*   Do not import and instantiate Services inside components directly (except for the Root App).

---

## 4. Logging

*   **No Console Logs**: Do not use `console.log`, `console.warn`, etc. directly.
*   **Use LoggerService**: Always import the `logger` singleton.
    ```javascript
    import { logger } from "./services/logger-service.js";
    logger.debug("Player moved", { x, y });
    ```
*   **Env Awareness**: The logger automatically silences debug logs in production/test unless forced.

---

## 5. Components

*   **Private/Internal State**: Use Lit's `@state()` decorator.
*   **Public API**: Use `@property()`.
*   **Service Access**: Use `@consume({ context: myContext })`.

---

## 6. Git & Workflow

*   **Main Branch**: The source of truth is `main` (not `master`).
*   **CI Checks**: Do not merge PRs if the **CI & Coverage** workflow fails.
*   **Artifacts**: Do not commit `coverage/` or `dist/` folders (enforced via `.gitignore`).
