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
*   **Private Methods**: Document private methods with JSDoc but mark them as internal.

---

## 2. Testing & Coverage

### Requirements
*   **Services**: Must have **100% Line Coverage**. Logic is critical here.
*   **Pull Requests**:
    *   **Patch Coverage**: New code must have at least **80% coverage**.
    *   **Project Coverage**: Must not drop by more than **1%**.
*   **Tooling**: Use `vitest` for unit tests. Run `npm run test:coverage` to verify locally.
*   **Environment**: Tests must not rely on global side-effects. Use dependency injection (e.g., passing `env` or `options` in constructors) to test different configurations.
*   **Component Testing**:
    *   Must use **Vitest Browser Mode** (Chromium).
    *   Must include **Accessibility Tests** using `axe-core`.
    *   Example:
        ```javascript
        it("should have no accessibility violations", async () => {
            const results = await axe.run(element);
            expect(results.violations).toEqual([]);
        });
        ```

---

## 3. Architecture Patterns

### Services vs. Controllers
*   **Services**: Are **Singletons**. They manage data and business logic independent of the UI.
    *   *Example*: `GameStateService`, `LoggerService`.
    *   *Pattern*: Use **Lit Signals** (`@lit-labs/signals`).
*   **Controllers**: Are **UI Helpers**. They interact with the DOM/Lit Lifecycle.
    *   *Example*: `KeyboardController`.
    *   *Rule*: Do not put global state in a Controller.

### Reactive State Derivation
*   **Principle**: "Reactive State derivations over Imperative Synchronization".
*   **Reasoning**: Avoid "Glue Code" (manually syncing state between parents and children via events).
*   **Pattern**: Prefer **Reactive Primitives** (`@lit/task`, Signals) that derive UI state directly from usage.
*   **Anti-Pattern**: Using `onDataLoaded` callbacks to copy data from a Service to a Component's internal state.

### Use Cases (Domain Logic)
*   **Use Cases**: Pure business logic classes.
    *   *Example*: `EvaluateChapterTransitionUseCase`.
    *   *Rule*: Must be stateless and independent of UI/Lit. Delegate complex rules here.

### Dependency Injection
*   Use **Lit Context** (`@lit/context`) to provide Services to Components.
*   Use **Constructor Injection** for plain classes, Managers, and Controllers.
    *   Pass dependencies in an `options` object.
    *   Do not instantiate services inside other classes.
*   Do not import and instantiate Services inside components directly (except for the Root App).

---

## 4. Logging

*   **No Console Logs**: Do not use `console.log`, `console.warn`, etc. directly in production code.
*   **Use LoggerService**: Inject the logger instance.
    *   **Components**: Use `@consume({ context: loggerContext })`.
    *   **Classes/Controllers**: Pass via constructor options.
    ```javascript
    // In a class/controller
    this.logger = options.logger;
    this.logger.info("Quest started", { questId });
    ```
    *   **Global Import**: Only allowed in `GameBootstrapper` (Composition Root).
*   **Env Awareness**: The logger automatically silences debug logs in production/test unless forced.
*   **Best Practices**:
    *   Use `logger.debug()` for development-only logs
    *   Use `logger.info()` for important user actions
    *   Use `logger.warn()` for recoverable issues
    *   Use `logger.error()` for critical failures

---

## 5. Components

### File Architecture (4-File Pattern)
Every component must follow this strict structure in its own directory:
1.  **Logic** (`MyComponent.js`): Pure Lit component logic.
2.  **Styles** (`MyComponent.styles.js`): CSS exports.
3.  **Definition** (`my-component.js`): `customElements.define` and re-exports.
4.  **Test** (`MyComponent.spec.js`): Vitest browser tests + A11y.

### Reactivity
*   **Signals**: Components consuming signals must use the `SignalWatcher` mixin.
    ```javascript
    import { SignalWatcher } from "@lit-labs/signals";
    class MyComponent extends SignalWatcher(LitElement) { ... }
    ```

### Implementation Rules

*   **Private/Internal State**: Use Lit's `@state()` decorator.
*   **Public API**: Use `@property()`.
*   **Service Access**: Use `@consume({ context: myContext })`.
*   **Private Methods**: Use `#` prefix for private methods and helpers.
    ```javascript
    class MyComponent extends LitElement {
      // Public method
      startQuest(questId) {
        this.#validateQuest(questId);
        this.#executeQuest(questId);
      }
      
      // Private helper methods
      #validateQuest(questId) { ... }
      #executeQuest(questId) { ... }
    }
    ```
*   **Event Handlers**: Convert to private methods and bind with arrow functions in templates.
    ```javascript
    // In class
    #handleClick() { ... }
    
    // In template
    render() {
      return html`<button @click="${() => this.#handleClick()}">Click</button>`;
    }
    ```

### Helper Methods
*   **Extract Duplicated Logic**: If you see the same code pattern 2+ times, extract it to a private helper method.
*   **Single Responsibility**: Each helper should do one thing well.
*   **Descriptive Names**: Use clear, descriptive names for helpers (e.g., `#executeCommand`, `#mapServiceType`).

---

## 6. Code Quality

### Encapsulation
*   **Private by Default**: Make methods private (#) unless they need to be part of the public API.
*   **Clear API Surface**: Only expose what's necessary for external consumers.
*   **Helper Methods**: Extract common logic into private helper methods.

### Code Duplication
*   **DRY Principle**: Don't Repeat Yourself. Extract duplicated code into helpers.
*   **Threshold**: If you copy-paste code more than once, it should be a function.

### Naming Conventions
*   **Private Methods**: Prefix with `#` (e.g., `#handleEvent`, `#validateInput`)
*   **Event Handlers**: Use `#handle` prefix (e.g., `#handleClick`, `#handleSubmit`)
*   **Helpers**: Use descriptive verbs (e.g., `#executeCommand`, `#mapServiceType`, `#setLoadingState`)

---

## 7. Git & Workflow

*   **Main Branch**: The source of truth is `main` (not `master`).
*   **CI Checks**: Do not merge PRs if the **CI & Coverage** workflow fails.
*   **Artifacts**: Do not commit `coverage/` or `dist/` folders (enforced via `.gitignore`).
*   **Commit Messages**: Follow conventional commits format:
    ```
    type(scope): description
    
    Examples:
    feat(quest-hub): add quest filtering
    fix(game-view): resolve dialog state issue
    refactor(quest-controller): improve encapsulation
    docs(readme): update architecture section
    test(game-state): add signal tests
    ```

---

## 8. Performance

*   **Avoid Unnecessary Renders**: Use `willUpdate()` to check if updates are needed before re-rendering.
*   **Optimize Expensive Operations**: Cache results, use memoization when appropriate.
*   **Signal Usage**: Only subscribe to signals you actually need.
*   **Example**: Theme application optimization
    ```javascript
    willUpdate(changedProperties) {
      // Only apply theme if it actually changed
      if (this.gameState.themeMode.get() !== this._lastThemeMode) {
        this.applyTheme();
        this._lastThemeMode = this.gameState.themeMode.get();
      }
    }
    ```

---

## 9. Recent Best Practices (Phase 10)

### Event Handler Pattern
```javascript
class MyComponent extends LitElement {
  // Private event handlers
  #handleSubmit() { ... }
  #handleCancel() { ... }
  
  // Bind with arrow functions in template
  render() {
    return html`
      <button @click="${() => this.#handleSubmit()}">Submit</button>
      <button @click="${() => this.#handleCancel()}">Cancel</button>
    `;
  }
}
```

### Helper Extraction Pattern
```javascript
class MyComponent extends LitElement {
  // Extract duplicated command execution logic
  #executeCommand(command, fallback) {
    if (this.commandBus) {
      this.commandBus.execute(command);
    } else if (fallback) {
      fallback();
    }
  }
  
  // Use the helper
  #handleAction() {
    this.#executeCommand(
      new SomeCommand({ ... }),
      () => { /* fallback logic */ }
    );
  }
}
```

### Logging Pattern
```javascript
// Replace console.log/warn/error with logger
import { logger } from "../services/logger-service.js";

// Before (❌)
console.log("Quest started");
console.warn("Invalid state");

// After (✅)
logger.info("Quest started", { questId });
logger.warn("Invalid state", { state });
```
