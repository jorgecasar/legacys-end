# Lit Component Architecture

## 1. 4-File Pattern
Every component **MUST** follow this strict directory structure:

1.  **Logic** (`MyComponent.js`): Pure Lit component logic. Class definition only.
2.  **Styles** (`MyComponent.styles.js`): CSS exports using `css` tag.
3.  **Definition** (`my-component.js`): Side-effects only. Imports class, calls `customElements.define`.
4.  **Test** (`MyComponent.spec.js`): Vitest browser tests + A11y.

## 2. Service Injection
- **Do NOT** instantiate services internally.
- Use `@consume({ context: myContext })` to inject services.
- **MUST** use `accessor` keyword for decorated fields (standard decorators).
- **MUST** initialize fields to satisfy strict property initialization (use casting if needed).

```javascript
/** @type {import('../../services/interfaces.js').IQuestLoaderService} */
@consume({ context: questLoaderContext, subscribe: true })
accessor questLoader = /** @type {import('../../services/interfaces.js').IQuestLoaderService} */ (
    /** @type {unknown} */ (null)
);
```

## 3. Signals
- Use `@lit-labs/signals` for granular reactivity.
- Components consuming signals MUST use the `SignalWatcher` mixin.

```javascript
import { SignalWatcher } from "@lit-labs/signals";
class MyComponent extends SignalWatcher(LitElement) { ... }
```

## 4. Private Members
- Use `#` prefix for private properties and methods.
- Use `accessor` for public reactive properties if using decorators, or standard `static properties`.

## 5. Shadow DOM
- Always enable Shadow DOM.
- Use `this.shadowRoot.querySelector` or `@query` decorator to access elements.
