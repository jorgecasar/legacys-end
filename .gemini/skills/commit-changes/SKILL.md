---
name: commit-changes
description: Guide the process of verifying, committing, and pushing changes.
---

# Commit Changes

This skill standardizes how we contribute code to the repository.

## Usage

When the user asks to "upload code", "commit", "push", or "save changes", follow these steps:

1.  **Pre-requisite Check**:
    *   **MUST** have run `verify-changes` skill successfully immediately before this.
    *   **MUST** have checked/updated relevant documentation (Architecture, Standards, ADRs).
    *   If not, run `verify-changes` FIRST and/or update docs.
    *   If verification fails, **STOP**. Do not commit broken code.

2.  **Check Status**:
    *   Run `git status` to see what's changed.
    *   If nothing changed, inform the user.

3.  **Construct Message**:
    *   **Read Task ID**: Look at the header of the file in `docs/tasks/02_DOING/`. Extract the `<!-- id: ... -->` or filename.
    *   **Format**:
        \`\`\`text
        type(scope): description

        [Optional body]

        Task: #task-id
        \`\`\`
    *   **Types**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`.
    *   **Example**: `feat(auth): add login service` + `Task: #2026-02-03-auth-service`

4.  **Execute**:
    *   `git add .` (or specific files).
    *   `git commit -m "..."`.
    *   `git push origin <current-branch>`.

5.  **Notify**:
    *   Confirm the push was successful.
