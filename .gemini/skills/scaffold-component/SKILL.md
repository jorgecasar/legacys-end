---
name: scaffold-component
description: Generate a new Lit component following the strict 4-file architecture.
---

# Scaffold Lit Component

This skill generates a new Lit component following the project's strict architecture.

## Usage

When the user asks to "create a component", "scaffold a component", or "make a new component", follow these steps:

1.  **Ask for details** (if not provided):
    *   Component Name (kebab-case, e.g., `my-feature`).
    *   Target Directory (relative to `src/`, e.g., `components/features`).

2.  **Generate Files**:
    Create the following 4 files in a new directory `${TargetDirectory}/${ComponentName}`.

    **File 1: Logic (`${ClassName}.js`)**
    ```javascript
    import { LitElement, html } from 'lit';
    import { styles } from './${ClassName}.styles.js';

    /**
     * @element ${ComponentName}
     * @summary description
     */
    export class ${ClassName} extends LitElement {
      static styles = styles;

      render() {
        return html\`<div>${ComponentName} works!</div>\`;
      }
    }
    ```

    **File 2: Styles (`${ClassName}.styles.js`)**
    ```javascript
    import { css } from 'lit';

    export const styles = css\`
      :host {
        display: block;
      }
    \`;
    ```

    **File 3: Definition (`${ComponentName}.js`)**
    ```javascript
    import { ${ClassName} } from './${ClassName}.js';

    customElements.define('${ComponentName}', ${ClassName});
    ```

    **File 4: Test (`${ClassName}.spec.js`)**
    ```javascript
    import { test, expect } from '@vitest/browser/playwright';
    import './${ComponentName}.js';

    test.describe('${ComponentName}', () => {
      test('should render and pass a11y', async ({ page }) => {
        await page.setContent('<${ComponentName}></${ComponentName}>');
        const el = page.locator('${ComponentName}');
        await expect(el).toBeVisible();
        // Add a11y check if available
      });
    });
    ```

3.  **Verify**:
    *   Run `npm run lint:lit` on the new files if possible.
