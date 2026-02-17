---
name: Strict JSDoc Typing
description: Guidelines for writing strictly typed JavaScript using JSDoc.
---

# Strict JSDoc Typing

This project uses **TypeScript in JSDoc mode** (`checkJs: true`). All JavaScript code MUST be fully typed.

## Core Rules

1.  **No `any`**: Use specific types or `unknown` with narrowing.
2.  **Full Coverage**: Type ALL parameters, returns, and properties.
3.  **Strict Null Checks**: Handle `null`/`undefined` explicitly.

## Critical Patterns

### 1. Importing Types
Define types at the top of the file (after imports) using `@typedef`.
```javascript
import { something } from './utils.js';

/** @typedef {import('./types.js').MyType} MyType */

/** @param {MyType} data */
function process(data) { ... }
```

### 2. Lit Custom Elements
Always register the element in specific `HTMLElementTagNameMap`.
```javascript
/**
 * @element my-element
 * @fires change - Fired when value changes.
 */
export class MyElement extends LitElement { ... }

declare global {
  interface HTMLElementTagNameMap {
    "my-element": MyElement;
  }
}
```

### 3. Event Handling
Cast `e.target` to the specific element type.
```javascript
/** @param {InputEvent} e */
handleInput(e) {
  const target = /** @type {HTMLInputElement} */ (e.target);
}
```

### 4. Strict Object Shapes
Define shapes with `@typedef` for props/state.
```javascript
/**
 * @typedef {Object} User
 * @property {string} name
 * @property {string[]} [tags]
 */
```
