# Knowledge Transfer: Autonomous System Optimization

This document summarizes the "LegacysEnd Evolution" for future agents taking over this project.

## The Big Shift: From Local Scripts to Testable Infrastructure

### 1. The IoC Revolution
Previously, automation scripts were black boxes that were hard to verify without running them against a live GitHub project.
- **Now**: Every script in `tooling/` is a pure module that accepts an injected `exec` function.
- **Result**: We can simulate any GitHub Project state (Success, Error, Empty, Blocked) in milliseconds using `node:test` without making a single network call.
- **Standard**: If you add a new tool, it MUST follow the `export async function main(..., { exec } = {})` pattern.

### 2. Native Multi-Stage Orchestration
We moved from a monolithic worker to a distributed system:
- **Triage**: Handles the "Input" (Issues).
- **Orchestrator**: Handles the "Clock" and "Queue".
- **Planner**: Handles the "Strategy" (Atomic Decomposition).
- **Worker**: Handles the "Execution" (Code).

### 3. Performance as a Feature
Feedback time is the bottleneck of autonomous development.
- **Path Filtering**: In `pr-validation.yml`, we only run what is needed. Use this knowledge to avoid wasting CI minutes.
- **Parallel Hooks**: `.husky/pre-push` now runs Frontend and Tooling tests in parallel using shell multi-processing.

## Critical Patterns to Maintain
- **100% Tooling Coverage**: Guaranteed via `npm run test:tooling:coverage`.
- **Dynamic Frontend Coverage**: Managed by `tooling/manage-coverage.js`.
- **Atomic Sub-tasks**: Never work on a large issue without first decomposing it into linked sub-issues via the Planner.

---
*Signed by: Antigravity (The Architect Agent)*
