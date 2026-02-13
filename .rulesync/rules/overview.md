---
root: true
targets: ["*"]
description: "Project overview and general development guidelines"
globs: ["**/*"]
---

# Project Overview

- **Stack**: Node 24 (ESM), Lit (Web Components), Vite, Vitest.
- **Style**: Tabs, Semicolons, Double Quotes, Trailing Commas.
- **Architecture**: Clean Architecture (Domain, Infrastructure, Application, UI).
- **Principles**: Composition > Inheritance, Dependency Injection, Result Pattern for errors.

## Context on Demand (Specialized Guidelines)

Read these memories using `read_memory` or `read_file` when performing relevant tasks:

- **Architecture Details**: `architecture.md`
- **Git Flow & Commits**: `git-workflow.md`
- **Lit Component Standards**: `lit-standards.md`
- **Testing Philosophy**: `testing-philosophy.md`

## Gold Standard Files
- **Service**: `src/services/storage-service.js`
- **Component**: `src/components/reward-element/RewardElement.js`
- **Use Case**: `src/use-cases/evaluate-chapter-transition.js`
- **Controller**: `src/controllers/interaction-controller.js`
