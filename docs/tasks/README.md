# File-Based Kanban System

This directory contains the project's tasks and plans, organized in a Kanban-style structure. This system allows any AI agent to understand the current state of the project and continue work seamlessly.

## Structure

- **`00_BACKLOG/`**: Unrefined ideas and future features.
- **`01_TODO/`**: Tasks that are specified and ready for execution.
- **`02_DOING/`**: The single active task. **Only one task should be here at a time.**
- **`03_DONE/`**: Completed tasks.
- **`04_ARCHIVE/`**: Abandoned or deprecated tasks.

## Workflow

1.  **Create**: New tasks start in `00_BACKLOG` (ideas) or `01_TODO` (ready). Use `TEMPLATE.md`.
2.  **Pick**: Move a task from `01_TODO` to `02_DOING`.
3.  **Execute**: The AI reads the task file to get context.
4.  **Update**: As work progresses, the AI updates the "Memory / Current State" section of the task file.
5.  **Finish**: When all checklist items are done, move the file to `03_DONE`.

## Naming Convention

Task files MUST follow this pattern to ensure chronological sorting:
`YYYY-MM-DD-kebab-case-title.md`

Example: `2026-02-03-refactor-login-flow.md`

## usage for AI Agents

- **Start**: When beginning a session, check `02_DOING`. If a file exists, read it to restore context.
- **Stop**: Before ending a session, update the "Memory / Current State" section in the `02_DOING` file with a summary of progress and next steps.
