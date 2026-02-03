---
name: scaffold-service
description: Generate a new Service following the singleton pattern and strict typing.
---

# Scaffold Service

This skill generates a new Service, its Interface, and a Test file.

## Usage

1.  **Ask for details**:
    *   Service Name (e.g., `QuestLoader`).
    *   Directory (default: `src/services`).

2.  **Generate Files**:

    **File 1: Interface Update (`src/services/interfaces.js`)**
    *   Add the interface definition locally in the new file or append to `interfaces.js` if it exists (prefer separate file if modular).
    *   For this project, we append to `src/services/interfaces.js` if it's a central registry, OR create `I${ServiceName}.js`.

    **File 2: Service (`${ServiceName}Service.js`)**
    ```javascript
    import { Context } from '@lit/context';

    /**
     * @typedef {import('./interfaces.js').I${ServiceName}} I${ServiceName}
     */

    /**
     * @implements {I${ServiceName}}
     */
    export class ${ServiceName}Service {
      constructor() {}

      /**
       * description
       */
      doSomething() {
        // Implementation
      }
    }

    /**
     * Context for ${ServiceName}.
     * @type {Context<unknown, I${ServiceName}>}
     */
    export const ${ServiceNameLower}Context = new Context('${packageName}::${serviceName}');
    ```

    **File 3: Test (`${ServiceName}Service.spec.js`)**
    *   Standard unit test with Vitest.
