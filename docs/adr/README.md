# Architecture Decision Records (ADR)

We use Architecture Decision Records to document significant architectural decisions. This allows us to track the evolution of the system and understand the "why" behind technical choices.

## Usage

### Creating a New ADR
Use the AI skill `create-adr` to generate a new record.
1.  **Input**: Title of the decision.
2.  **Output**: A new numbered file in `docs/adr/` (e.g., `0005-use-signals.md`).

### Status Lifecycle
- **Proposed**: The decision is under review.
- **Accepted**: The decision has been agreed upon and is being implemented.
- **Deprecated**: The decision is no longer active but preserved for history.
- **Superseded**: The decision has been replaced by a newer ADR (reference the new one).

## References
- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's Template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/templates/decision-record-template-by-michael-nygard.md)
