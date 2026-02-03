# Legacy Patterns & Anti-Patterns

> **WARNING**: The following patterns are considered LEGACY and must be refactored when encountered.

## 1. Global Event Bus (`CustomEvent`)
*   **Anti-Pattern**: Using `window.dispatchEvent` or `document.dispatchEvent` for app-wide communication.
*   **Refactor To**: **Services** (`@lit/context`).
*   **Why**: Events are hard to trace and break encapsulation. Services are typed and injectable.

## 2. Component Fetching
*   **Anti-Pattern**: Using `fetch()` directly inside a component's `connectedCallback` or methods.
*   **Refactor To**: **Service Method**.
*   **Why**: UI logic should not handle data fetching. It makes testing impossible without mocking `fetch`.

## 3. The `any` Type
*   **Anti-Pattern**: `@type {any}` or `function(data)`.
*   **Refactor To**: JSDoc `@typedef` or specific interface.
*   **Why**: `any` disables type checking and autocomplete.

## 4. Monolithic Components
*   **Anti-Pattern**: Defining the class, styles, and registration in a single file.
*   **Refactor To**: **4-File Pattern** (Logic, Styles, Definition, Test).
*   **Why**: Separation of concerns and testability.

## 5. Direct DOM Manipulation
*   **Anti-Pattern**: `document.getElementById` or `this.querySelector` (mostly).
*   **Refactor To**: `@query` decorator or `this.shadowRoot.querySelector`.
*   **Why**: Encapsulation. Components should only touch their Shadow DOM.
