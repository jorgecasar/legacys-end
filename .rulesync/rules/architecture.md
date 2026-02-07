---
targets: ["*"]
description: "Clean architecture and decoupling rules"
---

# Architecture & Decoupling

## Layers
1. **Domain (src/core, src/use-cases)**: Pure business logic. No dependencies on UI or external APIs.
2. **Infrastructure (src/services)**: Adapters for external systems (Storage, AI, APIs).
3. **Application (src/controllers)**: Orchestrates Use Cases and manages UI state.
4. **UI (src/components)**: Lit elements.

## Rules
- **Dumb vs Smart**: Presentation components must NOT consume contexts directly. They receive `@property` and emit events.
- **Dependency Injection**: Use `@lit/context` to inject services into controllers or smart components.
- **Error Handling**: Use the **Result Pattern** for all Use Cases and Services to avoid unhandled exceptions.
