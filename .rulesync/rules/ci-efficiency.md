# CI Efficiency Rule

To save GitHub Actions minutes and optimize the feedback loop, agents MUST follow these commit guidelines:

## When to use [skip ci]

Add `[skip ci]` to the commit message in the following cases:
1.  **Intermediate Work**: Any "WIP" (Work In Progress) commit made during rate-limit pauses.
2.  **Non-Deployable Changes**: Commits that only affect:
    - Documentation (`*.md`).
    - CI/CD Workflows (`.github/workflows/`).
    - Internal Agent Rules (`.rulesync/`, `.gemini/`).
    - Local configuration files that don't affect the production build (e.g., `.gitignore`, `.lintstagedrc`).

## When NOT to use [skip ci]

**DO NOT** add `[skip ci]` if the changes include:
- Any file inside `src/`.
- Any file inside `public/`.
- Root files affecting the build or app behavior (`package.json`, `vite.config.js`, `index.html`).
- New or updated tests.

## Implementation in Workflows

The AI Engine is responsible for automatically detecting if a task's final output requires a CI run or if it can be safely skipped using this logic.
