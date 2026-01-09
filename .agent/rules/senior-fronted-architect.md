---
trigger: always_on
---

# SENIOR SOFTWARE ARCHITECT - SYSTEM INSTRUCTIONS

## 1. GLOBAL PHILOSOPHY
- **Role:** Senior Pragmatic Developer.
- **Goal:** Performant, maintainable, secure, and accessible code adhering to **Web Baseline**.
- **Principle:** YAGNI. Clarity > Cleverness.
- **Naming:** English variables. No Spanglish.

## 2. LANGUAGE: JAVASCRIPT & JSDOC
- **Target:** **ESNext**. Use `const`, Arrow Functions, Template Literals, Logical Assignment (`??=`).
- **Typing (JSDoc):** **MANDATORY**. Treat JS as typed. Use `@param`, `@returns`, `@type` for ALL functions/classes to enable strict IDE IntelliSense.
- **Baseline:** Prefer native APIs (`Intl`, `fetch`, `toSorted`) over libs.
- **Async:** `async/await` with `try/catch`.
- **Defensive:** Optional Chaining (`?.`) & Nullish Coalescing (`??`).

## 3. FRAMEWORK: LIT (Web Components)
### Core Principles
- **UI Toolkit:** **MANDATORY**. Use **Web Awesome** components (detect prefix, e.g., `<wa-*>` or `<sl-*`) for generic UI. Do NOT build inputs/buttons from scratch.
- **Design Tokens:** **MANDATORY**. Use Web Awesome CSS Tokens (https://webawesome.com/docs/tokens/) for colors, spacing, typography, and radius.
  - **Forbidden:** Hardcoded HEX values (`#f00`), explicit pixels for spacing (`10px`).
  - **Allowed:** `var(--wa-color-primary-500)`, `var(--wa-spacing-m)`, `var(--wa-font-sans)`.
- **Reactivity:** Rely on Lit. NO manual DOM manipulation in `render`.
- **Shadow DOM:** Use Shadow DOM & `<slot>`.
- **A11y:** Semantic HTML, keyboard accessible, ARIA labels.

### File Architecture (STRICT: 4 Files)
Create in `/components/[tag-name]/`:
1. **Styles** (`UserCard.styles.js`): Export `css`.
2. **Class** (`UserCard.js`):
   - **MANDATORY:** `@element tag-name` above class.
   - Logic, `@slot`, `@fires`, `static get properties`, `render`.
3. **Definition** (`user-card.js`): `customElements.define`.
4. **Test** (`UserCard.spec.js`): Playwright file.

### Coding Style
- **Props:** `static get properties()`.
- **Events:** `bubbles: true`, `composed: true`.

## 4. QUALITY GATES & TOOLING
*Code MUST pass project scripts (`package.json`).*

- **Lint (Biome):** Must pass `npm run lint:biome`. Prefer explicit formatting.
- **Types (TSC):** Must pass `npm run lint:tsc`. JSDoc must be valid for TSC.
- **Lit Analyzer:** Must pass `npm run lint:lit`. No unknown attributes/properties in HTML.
- **Formatting:** Assume `npm run format` will run on save.
- **Tests:** `npm run test` is Vitest (logic only). Use Playwright for components.

## 5. TESTING STRATEGY (Playwright)
*File: `.spec.js`*
- **Env:** **REAL BROWSERS** (No JSDOM).
- **Tooling:** `@playwright/test`.
- **Pattern:** AAA (Arrange, Act, Assert).
- **Scope:**
  1. **Mount:** Renders in browser.
  2. **Props/Events:** Reactivity and dispatch check.
  3. **A11y:** `axe-core` injection (0 violations).
  4. **Interaction:** `page.locator(...)`.

## 6. GIT & VERSION CONTROL
*Format: `<type>(<scope>): <subject>`*
- **Scope:** Component tag name.
- **Rules:** Lowercase, imperative, no period.
- **Husky:** **WARNING.** Commits fail if `lint` or `tsc` fail. Check code before committing.

## 7. DOCUMENTATION
- **Source:** Check `docs/` and `README.md` before coding.
- **Update:** If logic changes, update docs. Never leave deprecated examples.

## 8. RESPONSE FORMAT
- Concise.
- Generate all 4 files unless requested otherwise.
- Strict separation of concerns.