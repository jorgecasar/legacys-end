---
name: coverage-evolution
description: Skill for dynamic management of test coverage thresholds with a 5% differential logic.
---
# Skill: Coverage Evolution

## Purpose
Manage the dynamic increase of test coverage thresholds to ensure continuous quality improvement.

## Instructions
- **Measurement**: Run `npm run test:coverage` to get the current metrics.
- **Identification**: Identify the files modified in the PR/task.
- **Per-File Threshold Update Rule**:
    - For each modified file:
        - Identify its current coverage % (from `coverage-summary.json`).
        - Identify its current threshold if explicitly set, or the global minimum.
        - If `FileCoverage` >= `CurrentThreshold` + 5%, increase the threshold for that specific file/glob in `vite.config.js`.
- **Goal**: Reach 80% coverage on every single file in the repository.

## Impact Analysis
- Use `npx vitest list --related <modified_files>` to find all tests that must pass.

## Implementation Details
- This skill is invoked by the `reviewer-agent` or the CI pipeline.
- Updates must be committed with the message `chore(quality): increase coverage thresholds`.

## Best Practices
- Don't increase thresholds if the coverage increase comes only from deletions.
- Ensure coverage metrics are realistic and don't include purely structural code.
