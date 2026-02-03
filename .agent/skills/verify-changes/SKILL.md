---
name: verify-changes
description: Runs all project verification checks (Lint, Types, Tests, Build).
---

# Verify Changes Skill

This skill ensures that the codebase is in a healthy state before committing or finalizing a task.

## Usage

Run this skill:
1.  **Before committing** changes.
2.  **After refactoring** critical components.
3.  **When receiving a "fix"** to ensure it actually works.

## Instructions

1.  **Code Style (Biome)**:
    *   Run `npm run lint:biome`.
    *   If auto-fixable errors exist, run `npm run lint:biome:fix`.

2.  **Type Safety (TSC)**:
    *   Run `npm run lint:tsc`.
    *   **CRITICAL**: Do not ignore errors. Fix them properly.

3.  **Lit Analysis**:
    *   Run `npm run lint:lit`.

4.  **Testing**:
    *   Run `npm run test:coverage`.
    *   Check for regressions (failed tests) and coverage drops.

5.  **Build Integrity**:
    *   Run `npm run build`.
    *   Ensures that the production build works.

## Failure Protocol

*   If **ANY** step fails, the verification is **FAILED**.
*   Do **NOT** proceed to commit.
*   Analyze the error, fix it, and re-run this skill.
