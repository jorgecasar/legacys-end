---
description: Genera un nuevo componente Lit siguiendo la arquitectura estricta de 4 archivos (Estilos, Clase, Definición, Test) con Playwright y JSDoc.
---

# WORKFLOW: SCAFFOLD LIT COMPONENT

**Goal:** Create a production-ready Lit component with strict separation of concerns.

**Step 1: Setup & Folder**
1. Ask the user for the component tag name (kebab-case) if not provided.
2. Create a dedicated folder: `/components/[tag-name]/`.

**Step 2: Generate Files (Strict Order)**
Generate the following 4 files. Ensure imports are relative and include `.js`.

1. **Styles File** (`[PascalCase].styles.js`):
   - Export `const [camelCase]Styles = css\`...\`;`.
   - Add basic layout styles (`:host { display: block; }`).

2. **Class File** (`[PascalCase].js`):
   - Import `[camelCase]Styles`.
   - Add JSDoc: `@element [tag-name]`, `@slot`, `@fires`.
   - Class must extend `LitElement`.
   - Return styles in array: `static get styles() { return [[camelCase]Styles]; }`.
   - Implement `static get properties()` and `render()`.

3. **Definition File** (`[tag-name].js`):
   - Import the Class.
   - Run `customElements.define('[tag-name]', [ClassName]);`.

4. **Test File** (`[PascalCase].spec.js`):
   - Import `@playwright/test`.
   - **CRITICAL:** Do NOT use `jsdom` or `@open-wc/testing`.
   - Write a test using `test.describe` and `test()`:
     - Check component mounts.
     - Check Accessibility (A11y) using `axe-core`.
5. **Documentation Update:**
   - If a generic documentation file exists (e.g., `docs/COMPONENTS.md` or `README.md`), add an entry for the new component.
   - Example format: `| <[tag-name]> | [Description] |`

**Step 3: Verification**
- Confirm strict types in JSDoc.
- Verify naming conventions (kebab-case for files/tags, PascalCase for classes).