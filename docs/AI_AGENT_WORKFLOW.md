# AI Agent Workflow Documentation

This document describes the autonomous agent system designed to handle the development lifecycle from GitHub issues to Pull Requests.

## 🏗 System Architecture

The system is composed of specialized steps that interact through the GitHub API and the filesystem.

### 1. Triage Step (`tooling/ai-orchestration/triage.js`)
- **Responsibility**: Categorize and prioritize incoming work.
- **Input**: All open issues in the repository.
- **Logic**: Uses Gemini to decide:
  - `priority`: `P0`, `P1`, or `P2`.
  - `labels`: Adds `epic`, `task`, `bug`, and `ai-triaged`.
- **Output**: Updates GitHub Project V2 fields via `triage-adapter.js`.

### 2. Selection Step (`tooling/ai-orchestration/selection.js`)
- **Responsibility**: Select the optimal next task.
- **Logic**:
  - Uses recursive discovery to find "leaf" tasks (open issues without open sub-issues).
  - Prioritizes "Started context" (tasks where parent is `Paused`).
  - Marks selected task as `In Progress`.
- **Output**: Dispatches the **AI Worker Agent**.

### 3. Planning Step (`tooling/ai-workers/plan.js`)
- **Responsibility**: Technical strategy and environment setup.
- **Logic**:
  - Analyzes the task using the `/planner` subagent.
  - Decomposes into native sub-issues if the task is an EPIC.
  - Creates a technical branch if implementing.
- **Output**: Detailed plan and methodology.

### 4. Development Step (`tooling/ai-workers/develop.js`)
- **Responsibility**: Code implementation.
- **Logic**:
  - Uses Serena tools for symbolic code navigation and editing.
  - Follows strict project conventions (Tabs, JSDoc, ESM).
  - Runs tests to verify changes.
- **Output**: Code commits and PR.

## 🛠 Infrastructure Adapters

### GitHub Adapter (`tooling/github/`)
- `index.js`: Core Octokit operations.
- `triage-adapter.js`: Maps AI JSON decisions to Project V2 field updates.
- `create-subissue.js`: Handles native linking between issues.

### Gemini Engine (`tooling/gemini/`)
- `run-cli.js`: Autonomous wrapper for `@google/gemini-cli` with 429 (rate limit) handling and real-time debug visibility.
- `pricing.js`: Centralized model fallback chains and cost calculator.

## 💎 Key Features

### Autonomous Execution
The system uses `--yolo` mode with `gemini-cli`, allowing the agents to perform file operations and GitHub actions without human intervention.

### Rate Limit Management
`run-cli.js` automatically detects 429 errors and waits for the specific cooldown period before retrying, ensuring stability during high load.

### Token & Cost Tracking
Every worker session calculates its total cost and syncs it back to the "Cost" field in the GitHub Project board.
