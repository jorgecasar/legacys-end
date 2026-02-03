# Testing Standards

## Overview
This document defines the strict testing requirements for the project.

## 1. Coverage Requirements
- **Services**: **100% Line Coverage** is MANDATORY. Logic is critical.
- **Components**: Focus on interaction and accessibility.
- **New Code**: Must have at least **80% coverage**.
- **Project Total**: Must not drop by more than **1%**.

## 2. Tooling
- **Unit Tests**: `vitest`
- **Component Tests**: `vittest` in **Browser Mode** (Chromium).
- **E2E Tests**: `playwright`

## 3. Component Testing Strategy
- **Environment**: Real Browser (No JSDOM).
- **Pattern**: AAA (Arrange, Act, Assert).
- **Mandatory Checks**:
    1.  **Mount**: Renders in browser.
    2.  **A11y**: `axe-core` injection (0 violations).
    3.  **Interaction**: Use `page.locator(...)`.

### Example
```javascript
import { test, expect } from '@vitest/browser/playwright';
import { a11yFixture } from '@lit-labs/testing/fixtures.js'; // Hypothetical helper

test.describe('MyComponent', () => {
    test('should pass a11y', async ({ page }) => {
        await page.setContent('<my-component></my-component>');
        const el = page.locator('my-component');
        await expect(el).toBeVisible();
        // Run axe checks here
    });
});
```

## 4. Service Testing Strategy
- **Fakes over Mocks**: Use "Fakes" (lightweight implementations) over "Mocks" (spies) for stateful dependencies.
- **Behavioral Assertions**: Test state changes, not internal calls.

## 5. Commands
- `npm run test`: Run unit tests.
- `npm run test:coverage`: Run tests with coverage.
- `npm run test:e2e`: Run Playwright E2E tests.
