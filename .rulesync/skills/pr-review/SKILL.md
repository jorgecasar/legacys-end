---
name: pr-review
description: >-
  Guidelines for the AI agent to handle feedback on Pull Requests and 
  interact with human reviewers.
---
# PR Review Skill

This skill governs how the AI agent responds to feedback provided via GitHub PR comments.

## Interaction Principles

### 1. Responsiveness
- When a comment is made on a PR with the `automated-pr` label, the agent must address all points raised.
- Acknowledge the feedback by summarizing the plan to address it.

### 2. Implementation
- **Maintain History**: Always use `git commit --amend` to update the PR. We want to keep a single, clean commit per task.
- **Stay Rebased**: Before pushing corrections, ensure the branch is still rebased on `main`.
- **Force Push**: Use `git push --force-with-lease` to update the branch after amending.

### 3. Verification
- After applying fixes, the agent should perform a quick "self-review" to ensure no new issues were introduced.
- Ensure all tests still pass (if the environment allows).

## Workflows

### 1. Handling PR Comments
1. Analyze the reviewer's comments in `github.event.comment.body`.
2. Checkout the PR branch.
3. Rebase on `main`.
4. Apply requested changes.
5. Run tests/linting.
6. Amend the previous commit: `git commit --amend --no-edit`.
7. Push: `git push origin HEAD --force-with-lease`.
8. Comment on the PR indicating that the changes have been applied.
