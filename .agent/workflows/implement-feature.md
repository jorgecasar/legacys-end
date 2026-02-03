---
description: Step-by-step guide to adding a new feature (Service -> Domain Logic -> UI).
---

# Implement New Feature

This workflow guides you through the process of implementing a new feature in `legacys-end`.

## 1. Plan & Design
1.  **Understand Requirements**: Read the user request carefully.
2.  ** consult Architecture**: Check `docs/ARCHITECTURE_TOBE.md` to align with the vision.
3.  **Identify Components**:
    *   What **Service** holds the state?
    *   What **Domain Logic** is needed?
    *   What **UI Components** are required?

## 2. Implement Core Logic (Bottom-Up)
1.  **Create Service Interface**: Define the contract in `src/services/interfaces.js` (or similar).
2.  **Scaffold Service**: Use the `scaffold-service` skill.
    *   `src/services/<Feature>Service.js`
    *   `src/services/<Feature>Service.spec.js`
3.  **Implement Logic**: Write the business logic in the service.
4.  **Test Service**: Run `npm test src/services/<Feature>Service.spec.js`. **MUST PASS**.

## 3. Implement UI
1.  **Scaffold Component**: Use the `scaffold-component` skill.
    *   `src/components/<feature>/<component-name>/...`
2.  **Inject Service**: Use `@consume` to get the service.
3.  **Implement View**: Use `render()` and styles.
4.  **Test Component**: Run the spec file.

## 4. Integrate & Verify
1.  **Add to App**: Instantiate the service in the root (if global) or parent context.
2.  **Manual Check**: Verify in the browser.
3.  **Final Tests**: Run all tests to ensure no regressions.
