---
name: create-task
description: Creates a new task file in docs/tasks following the standard template.
---

# Create Task Skill

This skill automates the creation of new task files in the project's Kanban system (`docs/tasks/`).

## Inputs

- `title` (required): The title of the task. Keep it concise.
- `status` (optional): The initial status. Defaults to "TODO". Allowed values: "BACKLOG", "TODO".

## Instructions

1.  **Determine the Date**: Get the current date in YYYY-MM-DD format.
2.  **Format the Title**: Convert the `title` to kebab-case for the filename (e.g., "My Task" -> "my-task").
3.  **Determine the Target Directory**:
    - If `status` is "BACKLOG", use `docs/tasks/00_BACKLOG`.
    - If `status` is "TODO" (default), use `docs/tasks/01_TODO`.
4.  **Read the Template**: Read the content of `docs/tasks/TEMPLATE.md`.
5.  **Create the File**:
    - Construct the new filename: `[YYYY-MM-DD]-[kebab-title].md`.
    - Replace the placeholders in the template content:
        - `[Task Title]` -> The provided title.
        - `[Status]` -> The status (Backlog/Todo).
        - `[YYYY-MM-DD]` -> The current date.
    - Write the new content to the target file path.
6.  **Output**: Print the path of the created file.

## Example Usage

User: "Create a task for refactoring the login form"
Agent:
1. Calls `create-task` with title="Refactor Login Form".
2. Creates `docs/tasks/01_TODO/2023-10-27-refactor-login-form.md`.
