# Legacy's End - Project Standards & Guidelines

> **CRITICAL ARCHITECTURAL DIRECTIVE**
> All code changes, refactors, and new features MUST align with the system architecture defined in `docs/ARCHITECTURE.md`.
>
> **Core Principles of Current Architecture**:
> 1.  **Strict 3-Layer Structure**: `App (Router)` -> `QuestView (Context Provider)` -> `GameViewport (Engine)`.
> 2.  **Domain-Driven State**: No monolithic `GameState`. Use `HeroState`, `QuestState`, `WorldState`.
> 3.  **No Global Singletons**: All services must be Classes injected via `@lit/context`.
> 4.  **Interface-Driven Architecture**: All core services MUST define an abstract interface in `src/services/interfaces.js`.
> 5.  **Strict Context Typing**: Components MUST consume services using their interface type in JSDoc for better decoupling and testability.
> 6.  **No EventBus/CommandBus**: Use direct Service Injection.

This document outlines the mandatory architectural and coding standards for "Legacy's End". All contributions must adhere to these rules to ensure consistency, maintainability, and quality.

---

## 0. Philosophy & Core Principles

*   **Goal**: Performant, maintainable, secure, and accessible code adhering to **Web Baseline**.
*   **Principle**: YAGNI (You Ain't Gonna Need It). Clarity > Cleverness.
*   **Language**: English variables. No Spanglish.
*   **Tech Stack**:
    *   **Target**: **ESNext**. Use `const`, Arrow Functions, Template Literals, Logical Assignment (`??=`).
    *   **Baseline**: Prefer native APIs (`Intl`, `fetch`, `toSorted`) over libraries.
    *   **Async**: `async/await` with `try/catch`.
    *   **Defensive**: Optional Chaining (`?.`) & Nullish Coalescing (`??`).

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
*   **No "Any"**: The use of `any` is strictly forbidden. Use `unknown` for truly dynamic types or define specific shapes.
*   **Stricter Typing**: All variables, parameters, and return types must be explicitly typed using JSDoc. Avoid generic `Object` types; define the shape.
*   **Interface Casting**: When using `@consume`, cast the context initial value using JSDoc to the interface type.
    ```javascript
    /** @type {import('../../game/interfaces.js').IQuestStateService} */
    @consume({ context: questStateContext, subscribe: true })
    accessor questState = /** @type {import('../../game/interfaces.js').IQuestStateService} */ (
        /** @type {unknown} */ (null)
    );
    ```
*   **Private Methods**: Document private methods with JSDoc but mark them as internal.

---

## 2. Testing & Coverage

### Requirements
*   **Services**: Must have **100% Line Coverage**. Logic is critical here.
*   **Pull Requests**:
    *   **Patch Coverage**: New code must have at least **80% coverage**.
    *   **Project Coverage**: Must not drop by more than **1%**.
*   **Tooling**: Use `vitest` for unit tests. Run `npm run test:coverage` to verify locally.
*   **Linting**: Code must pass `npm run lint:biome`, `npm run lint:tsc`, and `npm run lint:lit`.
*   **TSC Hardening**: The project uses an ultra-strict configuration (`verbatimModuleSyntax`, `useDefineForClassFields`, `skipLibCheck: false`). Any code that breaks these checks must be refactored to comply; do not use `@ts-ignore` unless absolutely necessary and documented.
*   **Environment**: Tests must not rely on global side-effects. Use dependency injection (e.g., passing `env` or `options` in constructors) to test different configurations.
*   **Component Testing**:
    *   Must use **Vitest Browser Mode** (Chromium).
    *   Must include **Accessibility Tests** using `axe-core`.
    *   Example:
        ```javascript
        it("should have no accessibility violations", async () => {
        });
        ```

### Behavior-Driven Testing Strategy
To avoid brittle tests that break with implementation changes:
*   **Fakes over Mocks**: Prefer using "Fakes" (lightweight in-memory implementations) over "Mocks" (spies on internal calls) for stateful services.
    *   *Why*: Mocks couple tests to *how* something is done (e.g., "was `setTheme` called?"). Fakes verify *what* happened (e.g., "is the theme now 'dark'?").
*   **Behavioral Assertions**: Assert on public state changes or public side effects, not on internal method calls.
    *   *Bad*: `expect(service.setInternalFlag).toHaveBeenCalled()`
    *   *Good*: `expect(service.state.flag.get()).toBe(true)`
*   **Regression Testing (MANDATORY)**:
    *   **Rule**: When a bug is reported, you **MUST** first create a failing test case that reproduces the bug before fixing it.
    *   **Process**:
        1.  Create a test case (e.g., `it('should handle edge case X')`) that fails.
        2.  Verify it fails (red).
        3.  Implement the fix.
        4.  Verify it passes (green).
    *   **Goal**: Prevent the bug from ever resurfacing.
*   **Example**:
    ```javascript
    // Instead of mocking GameStateService and checking calls:
    const fakeGameState = new FakeGameStateService(); // Implements same interface, stores state in memory
    const manager = new GameSessionManager({ gameState: fakeGameState });
    
    manager.changeTheme('dark');
    expect(fakeGameState.themeMode.get()).toBe('dark'); // Robust against refactors
    ```

---

## 3. Architecture Patterns

### Services vs. Controllers
*   **Services**: Are **Singletons**. They manage data and business logic independent of the UI.
*   **Controllers**: Are **UI Helpers**. They interact with the DOM/Lit Lifecycle.

#### 🧠 Logic Placement Decision Tree
```mermaid
flowchart TD
    Start([New Logic Needed]) --> Global{Is it Global State?}
    Global -- Yes --> Service[Service (Singleton)]
    Global -- No --> UI{Is it UI Logic?}
    
    UI -- Yes --> Reusable{Reusable?}
    Reusable -- Yes --> Controller[Controller (Class)]
    Reusable -- No --> Component[Component (Internal)]
    
    UI -- No --> Domain{Complex Domain Rule?}
    Domain -- Yes --> UseCase[Use Case (Pure Function)]
    Domain -- No --> Service
```

*   **Rule**: Do not put global state in a Controller.

### Reactive State Derivation
*   **Principle**: "Reactive State derivations over Imperative Synchronization".
*   **Reasoning**: Avoid "Glue Code" (manually syncing state between parents and children via events).
*   **Pattern**: Prefer **Reactive Primitives** (`@lit/task`, Signals) that derive UI state directly from usage.
*   **Anti-Pattern**: Using `onDataLoaded` callbacks to copy data from a Service to a Component's internal state.

### Use Cases (Domain Logic)
*   **Use Cases**: Pure business logic classes.
    *   *Example*: `EvaluateChapterTransitionUseCase`.
    *   *Rule*: Must be stateless and independent of UI/Lit. Delegate complex rules here.

### Component Testing Strategy (Playwright)
*   **Env**: **REAL BROWSERS** (No JSDOM).
*   **Pattern**: AAA (Arrange, Act, Assert).
*   **Scope**:
    1.  **Mount**: Renders in browser.
    2.  **Props/Events**: Reactivity and dispatch check.
    3.  **A11y**: `axe-core` injection (0 violations).
    4.  **Interaction**: `page.locator(...)`.
*   Use **Lit Context** (`@lit/context`) to provide Services to Components and Controllers.
*   **Controller Dependency Strategy**:
    *   Controllers are responsible for requesting the services they need via `ContextConsumer`.
    *   Avoid passing long lists of services via constructor `options`.
    *   Use constructor injection only for plain classes that do not have access to the Lit lifecycle or host.
*   **Reactive Controller Pattern**: Mandatory for controllers consuming services or state. The host component provides dependencies (via its own context or properties), and the controller consumes them. Refer to `docs/TECHNICAL_REFERENCE.md` for detailed implementation guidelines.
*   Do not import and instantiate Services inside components directly (except for the Root App).

---

## 4. Logging

*   **No Console Logs**: Do not use `console.log`, `console.warn`, etc. directly in production code.
*   **Use LoggerService**: Inject the logger instance.
    *   **Components**: Use `@consume({ context: loggerContext })`.
    *   **Controllers**: Use `ContextConsumer` to request the logger.
    ```javascript
    // In a controller constructor
    this._loggerConsumer = new ContextConsumer(host, {
      context: loggerContext,
      subscribe: true,
      callback: (logger) => { this.logger = logger; }
    });
    ```
    *   **Global Import**: Only allowed in `GameBootstrapper` (Composition Root).
*   **Env Awareness**: The logger automatically silences debug logs in production/test unless forced.
*   **Best Practices**:
    *   Use `logger.debug()` for development-only logs
    *   Use `logger.info()` for important user actions
    *   Use `logger.warn()` for recoverable issues
    *   Use `logger.error()` for critical failures

---

---

## 5. Components & UI

### UI Toolkit & Design Tokens
*   **Toolkit**: **MANDATORY**. Use **Web Awesome** components (detect prefix, e.g., `<wa-*>` or `<sl-*`) for generic UI.
    *   *Rule*: Do NOT build inputs, buttons, or complex controls from scratch.
*   **Design Tokens**: **MANDATORY**. Use Web Awesome CSS Tokens for colors, spacing, typography, and radius.
    *   **Forbidden**: Hardcoded HEX values (`#f00`), explicit pixels for spacing (`10px`).
    *   **Allowed**: `var(--wa-color-primary-500)`, `var(--wa-spacing-m)`, `var(--wa-font-sans)`.

### File Architecture (4-File Pattern)
Every component must follow this strict structure in its own directory:
1.  **Logic** (`MyComponent.js`): Pure Lit component logic.
2.  **Styles** (`MyComponent.styles.js`): CSS exports.
3.  **Definition** (`my-component.js`): Imports the class, calls `customElements.define`. **MUST NOT** export the class.
4.  **Test** (`MyComponent.spec.js`): Vitest browser tests + A11y.

**Rules**:
-   The **Class file** (`MyComponent.js`) is responsible for importing its dependencies (other components it uses).
-   The **Class file** MUST NOT define the custom element.
-   The **Definition file** (`my-component.js`) is the entry point for side-effects (registration) only.

### Reactivity
*   **Signals**: Components consuming signals must use the `SignalWatcher` mixin.
    ```javascript
    import { SignalWatcher } from "@lit-labs/signals";
    class MyComponent extends SignalWatcher(LitElement) { ... }
    ```

### Implementation Rules

*   **Private/Internal State**: Use Lit's `@state()` decorator.
*   **Public API**: Use `@property()`.
*   **Service Access**: Use `@consume({ context: myContext })` with `accessor` and initialization for type safety.
    ```javascript
    /** @type {import('../../services/interfaces.js').ILoggerService} */
    @consume({ context: loggerContext })
    accessor logger = /** @type {import('../../services/interfaces.js').ILoggerService} */ (/** @type {unknown} */ (null));
    ```
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

    Body (optional)

    Task: #task-id
    ```
    *   **Task Link**: You **MUST** append `Task: #<id>` to the footer. Get the ID from the active `02_DOING` file.

*   **Atomic Commits**:
    *   Ideally, **1 Task = 1 Commit** (or a series of linked commits).
    *   Do not bundle unrelated changes.

*   **Review Protocol (Continuous Improvement)**:
    *   If a review (manual or automated) detects an issue or improvement opportunity that is **NOT** critical for the current task:
        1.  Do **NOT** fix it immediately if it bloats the scope.
        2.  Do **NOT** ignore it.
        3.  **CREATE** a new task in `01_TODO` (using `create-task` status=TODO) to address it later.
    *   *Goal*: Maintain focus (Flow) while ensuring technical debt is recorded.

*   **Agent Protocol**:
    *   **Verification (NEW)**: Before committing, the Agent MUST run the `verify-changes` skill.
        *   This ensures Lint, Types, Tests, and Build pass.
        *   If verification fails, the Agent MUST NOT commit.
    *   **Documentation Maintenance**: With every code change, the Agent **MUST** review and update:
        *   `docs/TECHNICAL_REFERENCE.md` (if implementation details change).
        *   `docs/PROJECT_STANDARDS.md` (if conventions change).
        *   `docs/ARCHITECTURE.md` (if structure changes).
    *   **No Unvalidated Commits**: The AI Agent MUST NOT commit or push changes without explicit user validation or prior approval.
    *   **Validation First**: Always verify changes (tests, build, manual check) AND ask the user for confirmation before finalizing a task with a commit.

---

## 8. Performance

*   **Avoid Unnecessary Renders**: Use `willUpdate()` to check if updates are needed before re-rendering.
*   **Optimize Expensive Operations**: Cache results, use memoization when appropriate.
*   **Signal Usage**: Only subscribe to signals you actually need.
*   **Example**: Theme application optimization
    ```javascript
    willUpdate(changedProperties) {
      // Only apply theme if it actually changed
      if (this.themeService.themeMode.get() !== this._lastThemeMode) {
        this.applyTheme();
        this._lastThemeMode = this.themeService.themeMode.get();
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
---

## 10. Internationalization (i18n) & Glossary

*   **Runtime Localization**: Use `@lit/localize` for all user-facing strings.
*   **Reactive Loading**: Content must be exported as functions (e.g., `getQuestData()`) to ensure reactivity when the locale changes.
*   **Technical Glossary**: Technical terms must NOT be translated.
    *   **Strategy**: Documentation-based Preservation. Technical terms remain as plain text in `msg()` calls.
    *   **Source of Truth**: Consult `docs/I18N_GLOSSARY.md` for the list of non-translatable terms.
    *   **Workflow**: When extracting strings (`npm run localize:extract`) or translating XLIFF files, ensure terms from the glossary are preserved as English in the `<target>` tags.
*   **Plain Text Preference**: Avoid interpolating glossary constants into `msg()` in the source code. Prefer plain text for better readability and easier extraction.

---

## 11. AI Agent Workflow & Task Management

> **MANDATORY**: All AI Agents working on this repository MUST follow this workflow to ensure context persistence and project history.

### 1. Task Management (Kanban)
The project uses a file-based Kanban system in `docs/tasks/`.
*   **00_BACKLOG**: Ideas and potential features.
*   **01_TODO**: Tasks ready to be picked up.
*   **02_DOING**: The **single source of truth** for the active task. **Only one file allowed here.**
*   **03_DONE**: Completed tasks (history).

### 2. Session Protocol
1.  **Start / Status Update**: When beginning a session OR when the user asks about "next steps" or "status":
    *   **Check `docs/tasks/02_DOING`**:
        *   If a file exists, read it to restore context and report current progress.
        *   If empty, **SCAN** `docs/tasks/01_TODO` and **SUGGEST** the top priority tasks to the user.
2.  **During Work**: Update the task file's "Memory / Current State" section with progress before stopping or switching context.
3.  **Task Creation**: When the user requests a new feature `docs/tasks/TEMPLATE.md` to generate a standardized task file in `01_TODO` or `00_BACKLOG`.
4.  **Completion**: When finished, move the file to `03_DONE` and update the status in the file header.

