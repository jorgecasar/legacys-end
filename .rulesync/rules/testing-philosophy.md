---
targets: ["*"]
description: "Testing philosophy and standards"
---

# Testing Philosophy

## What to Test
- **Use Cases**: 100% coverage. These represent the core value of the application.
- **Controllers**: Test the orchestration and state transitions.
- **Components**: Focus on user interactions and visual states (Integration/E2E). Avoid testing implementation details.

## How to Test
- **Mocks**: Mock external services (AI, Storage, APIs) but keep domain logic real.
- **Readability**: Tests should read like a specification of the feature. Use descriptive `describe` and `it` blocks.
- **Evolution**: When refactoring, ensure tests still pass. If a test is too fragile, refactor the test to focus on behavior.
