# Implement Clear Layered Architecture <!-- id: 2026-02-07-layered-architecture -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The project lacks a clear separation of concerns. Logic is leaked into components, and services are tightly coupled to the main app component. We need to implement a formal layered architecture.

## Plan
- [ ] Define boundaries between **Domain** (logic), **Infrastructure** (external tools), and **UI**.
- [ ] Refactor existing Services to be "Adapters" that implement a specific interface.
- [ ] Move any business logic remaining in Components or Controllers into **Use Cases**.
- [ ] Ensure that Domain logic doesn't depend on UI frameworks (Lit).

## Artifacts
- `src/core/` (Domain types and logic)
- `src/use-cases/` (Business logic)
- `src/services/` (Infrastructure adapters)

## Memory / Current State
- Initial analysis shows high coupling in `LegacysEndApp`.
- Next step: Map dependencies between current services.
