---
description: Step-by-step guide to refactor a legacy component to the new architecture.
---

# Refactor Legacy Component

This workflow guides you through modernizing a component to the strict 4-file architecture.

## 1. Analysis
1.  **Identify State**: usage of `this.state = ...` or internal properties.
2.  **Identify Logic**: `fetch` calls, business rules, event handling.
3.  **Identify Dependencies**: What other components or globals does it use?

## 2. Extract Service (If needed)
If the component handles data types or API calls:
1.  **Create Service**: Use `scaffold-service`.
2.  **Move Logic**: Transfer methods from component to service.
3.  **Create Interface**: Define the public API.

## 3. Scaffold New Structure
1.  **Run Command**: `/gen:component <name> <path>`
2.  **Copy-Paste**: Do NOT overwrite yet. Create side-by-side or use a temporary name.

## 4. Migrate Implementation
1.  **Logic (`.js`)**:
    *   Inject Service (`@consume`).
    *   Move `properties` / `state`.
    *   Move `render` template.
2.  **Styles (`.styles.js`)**:
    *   Extract CSS from `static styles` or `<style>` tags.
3.  **Definition (`.js`)**:
    *   Ensure `customElements.define` is here.

## 5. Clean Up
1.  **Delete Legacy File**: Remove the old monolithic file.
2.  **Fix Imports**: Update references in other files.

## 6. Verify
1.  **Tests**: Update generated tests to match new functoinality.
2.  **Lint**: Run `/lint:arch` and `npm run lint`.
