---
name: agentic-design-patterns
description: Architectural patterns for autonomous agents.
---

# Agentic Design Patterns (LegacysEnd)

This skill distills the architectural mandates for any agent working on the LegacysEnd automation system.

## 1. Inversion of Control (IoC) in Scripts
**Mandate**: Never use global side-effecting functions (like `execSync`, `fetch`, or `fs`) directly inside core logic.
**Implementation**:
- Wrap core logic in an exported `main` function.
- Inject dependencies as a `deps` object or optional parameters.
- This allows 100% determinism in unit tests without fragile global mocks.

```javascript
// GOOD: Testable and Robust
export async function main(input, { exec = execSync } = {}) {
    exec(`gh project item-add ...`);
}
```

## 2. State-Driven Orchestration
**Mandate**: The GitHub Project V2 is the "Single Source of Truth" (SSoT) for the agentic loop.
- **Avoid**: Local state files or hidden caches.
- **Workflow**: 
    1. Query Project V2 Status.
    2. Act based on Priority/Labels.
    3. Update Project V2 Status immediately.
- This ensures that if an agent is interrupted (e.g., 429 error), the next agent picks up exactly where it left off.

## 3. Atomic Decomposition (Planning Step)
**Mandate**: Complex issues must be decomposed into sub-tasks (native GitHub Issues) BEFORE implementation begins.
- Use the `ai-worker-plan.js` pattern:
    1. Analyze the main issue.
    2. Generate a methodology (TDD/BDD/DDD).
    3. Create sub-issues if `needs_decomposition: true`.
    4. Link sub-issues to the parent.

## 4. Path Filtering & Parallel Feedback
**Mandate**: Differentiate between "Tooling" (infrastructure) and "Frontend" (product code).
- Use `dorny/paths-filter` in CI.
- Use parallel sub-processes in Git Hooks (`.husky/pre-push`) to minimize developer wait time while maintaining 100% tooling coverage.
