# 0001. Record Architecture Decisions

> **Status**: Accepted
> **Date**: 2026-02-03
> **Deciders**: Jorge Casar, Gemini Agent

## Context and Problem Statement
We want to record architectural decisions for this project so that we don't lose the context of why we made certain choices. We want to be able to look back and understand the evolution of the software.

## Decision Drivers
*   Need for long-term memory of technical decisions.
*   Need to standardize decision-making process.
*   facilitate onboarding of new agents or developers.

## Considered Options
*   **ADR (Architecture Decision Records)**: Text files in the repository.
*   **Wiki / Confluence**: External documentation.
*   **Commit Messages**: Relying on git history only.

## Decision Outcome
Chosen option: "**ADR**", because:
*   It lives with the code (version controlled).
*   It is text-based and easy for AI agents to read/write.
*   It follows a standard format (Nygard).

### Positive Consequences
*   Clear history of decisions.
*   Context is preserved for future refactors.

### Negative Consequences
*   Maintenance overhead (must update status).
