# File-Based Kanban System

This directory contains the project's tasks and plans, organized in a Kanban-style structure. This system allows any AI agent to understand the current state of the project and continue work seamlessly.

## Structure

- **`00_BACKLOG/`**: Unrefined ideas and future features.
- **`01_TODO/`**: Tasks that are specified and ready for execution. **Ordered by priority prefix (01, 02, ...).**
- **`02_DOING/`**: The single active task. **Only one task should be here at a time.**
- **`03_DONE/`**: Completed tasks.
- **`04_ARCHIVE/`**: Abandoned or deprecated tasks.

## Workflow

1.  **Create**: New tasks start in `00_BACKLOG` (ideas) or `01_TODO` (ready). Use `TEMPLATE.md`.
2.  **Prioritize**: When moving to `01_TODO`, assign a numeric prefix (e.g., `01-`, `02-`) to define execution order. **01 is the highest priority.**
3.  **Pick**: Move the task with the **lowest prefix number** from `01_TODO` to `02_DOING`.
4.  **Interrupt**: If a higher priority task (lower number) appears in `01_TODO` while a task is in `02_DOING`:
    - Update the current task's "Memory / Current State".
    - Move it back to `01_TODO` (renaming it if its priority has changed).
    - Pick the new higher-priority task and move it to `02_DOING`.
5.  **Execute**: The AI reads the task file to get context.
6.  **Update**: As work progresses, the AI updates the "Memory / Current State" section of the task file.
7.  **Finish**: When all checklist items are done, move the file to `03_DONE`.

## Priority Management

- **Urgent Fixes**: Use `00-` prefix for tasks that must be executed before anything else.
- **Intermediate Priority**: You can use decimals (e.g., `01.5-`) to insert tasks between existing priorities without renaming all files.
- **Dynamic Re-prioritization**: You (the user) or the AI can rename the files in `01_TODO` at any time to change the execution order.

Task files MUST follow this pattern to ensure chronological and priority sorting:
`[Priority]-YYYY-MM-DD-kebab-case-title.md`

Example: `01-2026-02-03-refactor-login-flow.md`

## usage for AI Agents

- **Start**: When beginning a session, check `02_DOING`. If a file exists, read it to restore context.
- **Stop**: Before ending a session, update the "Memory / Current State" section in the `02_DOING` file with a summary of progress and next steps.
