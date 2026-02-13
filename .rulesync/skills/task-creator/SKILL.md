---
name: task-creator
description: Create well-defined, actionable GitHub issues with clear goals and acceptance criteria.
---

# Skill: High-Quality Task Creator

## Purpose
This skill guides you in creating new GitHub issues that are clear, actionable, and aligned with the project's standards. A well-defined task minimizes ambiguity and helps agents (and humans) implement solutions correctly and efficiently.

## Instructions
When asked to create a new task, issue, or ticket, follow this template. Fill in each section thoughtfully.

### 1. Title
- **Format**: `type(scope): concise description`
- **Example**: `feat(auth): implement password reset flow`
- **Types**: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`.

### 2. Body Template

#### Parent Issue (Optional)
Link to a parent epic or related issue if applicable.
`Parent issue: #<issue_number>`

#### Goal
- **Clarity**: A concise paragraph explaining the **why** behind the task. What is the user story or technical objective?
- **Context**: Mention the high-level components or domains involved.

#### Key Responsibilities / Technical Requirements
- **Actionable Steps**: A numbered or bulleted list of concrete technical steps required.
- **Specificity**: Instead of "implement the feature," break it down: "1. Create a new service `UserService` in `src/services`," "2. Define the `IUser` interface in `src/core/types`," etc.
- **Out of Scope**: Mention what should *not* be done in this task.

#### Acceptance Criteria
- **Verification**: A checklist of observable outcomes that prove the task is complete.
- **Measurable**: Each item should be a verifiable statement.
- **Examples**:
    - `[ ] All new code is covered by unit tests with >90% coverage.`
    - `[ ] The "Reset Password" button is visible on the login page.`
    - `[ ] A storybook entry for the new component is created.`

## Example

**Title**: `feat(ui): create reusable confirmation-dialog component`

**Body**:

Parent issue: #42

**Goal**
To provide a standardized, reusable confirmation dialog (`<confirmation-dialog>`) for actions that require user confirmation, such as deleting an item. This will improve UI consistency and reduce code duplication.

**Key Responsibilities**
1.  Create a new Lit component at `src/components/confirmation-dialog/`.
2.  The component should accept `title`, `message`, and `confirmLabel` as properties.
3.  It should emit a `confirm` event when the primary action is clicked and a `cancel` event when closed.
4.  Use the project's existing `@lit/context` provider for theming.

**Acceptance Criteria**
- [ ] A new file `src/components/confirmation-dialog/ConfirmationDialog.js` exists.
- [ ] A Storybook story is created for the component with controls for all properties.
- [ ] The `confirm` and `cancel` events are documented and tested.
- [ ] The component is fully accessible (passes axe-core tests).
