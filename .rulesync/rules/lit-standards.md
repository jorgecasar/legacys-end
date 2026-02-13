---
targets: ["*"]
description: "Lit components and reactive state guidelines"
---

# Lit Development Standards

- **Components**: Standard TC39 Decorators. Use `accessor` for decorated fields. Separate styles into `[ComponentName].styles.js`.
- **State**: Use `@lit-labs/signals`. Provide state via `@lit/context`. Keep components "Dumb".
- **Lifecycle**: `willUpdate` for state transforms. Clean up in `disconnectedCallback`.
