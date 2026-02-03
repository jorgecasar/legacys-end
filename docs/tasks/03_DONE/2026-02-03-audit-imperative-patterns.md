# Task: Audit Imperative UI Patterns

## Status
- **Status**: DONE
- **Priority**: Low
- **Assignee**: AI Agent
- **Created**: 2026-02-03

## Context
Following the fix in `QuestView` where imperative `querySelector` calls were replaced by reactive signals in `WorldStateService`, we need to ensure no other components are using this anti-pattern.

## Objectives
- [x] Scan all components in `src/components/` for `shadowRoot.querySelector` or `this.querySelector`.
- [x] Identify if any of those calls are used to invoke methods on child components (e.g., `el.doSomething()`).
- [x] If found, refactor to use Signals, Events, or Context.

## Success Criteria
- [x] Zero instances of parent components calling methods on children via DOM references.
- [x] Documentation in `PROJECT_STANDARDS.md` remains the enforced rule.
