---
targets: ["*"]
description: "Lit components and reactive state guidelines"
---

# Lit Development Standards

## Components
- Use **Standard TC39 Decorators**.
- **IMPORTANT**: Decorated fields must be declared with the `accessor` keyword (e.g., `@state() accessor name = ""`).
- Separate styles into a `[ComponentName].styles.js` file.

## State Management
- Use **@lit-labs/signals** for reactive state.
- Prefer providing state via **@lit/context** rather than passing props deeply.
- Keep components "Dumb" (presentation only) whenever possible.

## Lifecycle
- Use `willUpdate` for state-to-state transformations.
- Clean up listeners and observers in `disconnectedCallback`.
