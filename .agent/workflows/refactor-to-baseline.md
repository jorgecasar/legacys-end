---
description: Refactoriza código JS/Lit existente para cumplir con Baseline, ESNext, JSDoc y separa en 4 archivos si es necesario.
---

# WORKFLOW: REFACTOR TO BASELINE

**Goal:** Modernize existing code to meet project standards (ESNext, JSDoc, Playwright).

**Step 1: Code Analysis**
- Identify "Anti-Patterns": `var`, `let` (where `const` works), `function` (vs arrows), string concatenation (vs templates).
- Identify "Heavy Dependencies": Usage of Lodash, Moment.js, or JSDOM.

**Step 2: Architecture Refactor**
- If the component is a single file, split it into the **4-file structure** (Style, Logic, Def, Spec).
- Extract CSS into `*.styles.js`.
- Move `customElements.define` to its own file.

**Step 3: Syntax & Typing**
- Convert to **ESNext**: Use `toSorted`, `with`, `async/await`.
- Apply **JSDoc**: Add `@param`, `@returns`, and `@element` to the class.
- Replace external utils with **Native Web APIs** (Baseline).

**Step 4: Test Migration**
- If tests exist in JSDOM/Open-WC, rewrite them to **Playwright** (`.spec.js`).
- Ensure `await expect(page).toHaveNoViolations()` (A11y) is present.