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

#### Dependencies (for sub-tasks)
- **Format**: When decomposing a task, list the numeric IDs of the tasks that MUST be completed before this one.
- **Example**: `Dependencies: [1, 3]` (This task is blocked by sub-task 1 and 3).

## Example

**Title**: `refactor(auth): migrate to JWT authentication`

**Body**:
This is a large task. It needs to be decomposed.

**Sub-tasks Plan:**
1.  **`feat(auth): add JWT library and config`**
    - Goal: Install `jsonwebtoken` and set up environment variables for the secret key.
    - Dependencies: []
2.  **`feat(auth): create token generation service`**
    - Goal: Implement a service that creates and signs a new JWT upon successful login.
    - Dependencies: [1]
3.  **`feat(auth): protect API routes with middleware`**
    - Goal: Create middleware that verifies the JWT on incoming requests to secure endpoints.
    - Dependencies: [2]
4.  **`refactor(ui): update login form to store token`**
    - Goal: Modify the frontend to save the received JWT to local storage.
    - Dependencies: [2]
