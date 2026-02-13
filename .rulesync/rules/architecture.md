---
targets: ["*"]
description: "Clean architecture and decoupling rules"
---

# Architecture & Decoupling

## Layers
1. **Domain**: Pure business logic (src/core).
2. **Infrastructure**: External adapters (Storage, AI, APIs) in src/services.
3. **Application**: Orchestration & UI state in src/controllers.
4. **UI**: Lit elements in src/components.

## Rules
- **Dependency Injection**: Use `@lit/context`.
- **Dumb Components**: UI components receive properties and emit events. No direct context consumption.
- **Error Handling**: Use Result Pattern.
