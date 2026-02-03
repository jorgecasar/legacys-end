# Clean Architecture & Ports-Adapters

## 1. Core Principles
- **Dependencies Rule**: Dependencies point INWARDS. Inner layers know nothing about outer layers.
- **Entities**: Pure JS objects. No Lit, no DOM, no fetch.
- **Use Cases**: Application business rules. Orchestrate Entities.

## 2. Layers
1.  **Domain (Inner)**
    - Entities (`src/domain/entities`)
    - Logic independent of frameworks.
2.  **Application (Middle)**
    - Services (`src/services`)
    - Use Cases (`src/domain/use-cases`)
    - Interfaces (`src/services/interfaces.js`)
3.  **Interface Adapters (Outer)**
    - Controllers (`src/controllers`)
    - Presenters (Lit Components)

## 3. Strict Rules
- **Services** MUST NOT import **Components**.
- **Services** MUST NOT import **Controllers**.
- domain logic **MUST NOT** import `lit` or `web-awesome`.

## 4. Enforcement
- We use `dependency-cruiser` to enforce these rules.
- Run `npm run lint:arch` to verify.
