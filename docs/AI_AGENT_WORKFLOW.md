# AI Agent Workflow Documentation

This document describes the autonomous agent system designed to handle the development lifecycle from GitHub issues to Pull Requests.

## 🏗 system Architecture

The system is composed of specialized agents that interact through structured JSON and Git.

### 1. Triage Agent (`tooling/gemini-triage.js`)
- **Responsibility**: Categorize and prioritize incoming work.
- **Input**: Open issues in the "Todo" column of the Project Board.
- **Logic**: Uses Gemini to decide:
  - `model`: `flash` (simple tasks) or `pro` (complex logic).
  - `priority`: `P0`, `P1`, or `P2`.
  - `labels`: Adds `ai-triaged` and relevant context labels.
- **Output**: Updates GitHub Project fields and issue labels.

### 2. Orchestrator Agent (`tooling/ai-orchestrator.js`)
- **Responsibility**: Select the optimal next task.
- **Logic**:
  - Prioritizes `Paused` tasks first, then by priority (`P0` > `P1` > `P2`).
  - Filters out "Blocked" tasks or "Container" tasks (those with open sub-issues).
  - Marks selected task as `In Progress`.
- **Output**: Dispatches the AI Worker.

### 3. Planning Agent (`tooling/ai-worker-plan.js`)
- **Responsibility**: Technical strategy and environment setup.
- **Logic**:
  - Generates a `slug` for the branch name.
  - Creates and pushes a new Git branch.
  - Generates a list of files to touch and methodology (`TDD`, `Manual`, etc.).
- **Structured Output**: Follows `PLAN_SCHEMA`.

### 4. Developer Agent (`tooling/ai-worker-develop.js`)
- **Responsibility**: Code implementation.
- **Logic**:
  - **Full Context**: Reads the current content of all files defined in the plan.
  - **Safe Execution**: Applies changes (create, write, delete) directly to the filesystem.
- **Structured Output**: Follows `DEVELOP_SCHEMA`.

## 🛠 E2E Execution Script (`tooling/ai-agent-flow.sh`)

This script allows for local and automated end-to-end execution.

### Parameters
- `--issue <number>`: Force execution of a specific issue.
- `--skip-ai`: Run the script logic without calling Gemini API (useful for testing infrastructure).
- `--skip-triage`: Skip the mass-classification phase.
- `--skip-orchestration`: Skip automatic task selection (requires `--issue`).
- `--skip-planning`: Skip technical plan generation.
- `--skip-develop`: Skip code generation and application.

### Local Setup
Ensure your `.env` file contains:
```text
GEMINI_API_KEY=your_key_here
GH_TOKEN=your_github_pat
```

Run with:
```bash
./tooling/ai-agent-flow.sh
```

## 💎 Key Technical Features

### Structured Output (JSON Schema)
All agents use the official `@google/genai` SDK with strict JSON schemas. This ensures the AI never returns conversational text or malformed JSON that could break the pipeline.

### Intelligent Fallback
The `gemini-with-fallback.js` utility implements a cost-aware retry logic:
1. Try `gemini-2.5-flash-lite` (Cheapest).
2. Fallback to `gemini-2.5-flash` on rate limits.
3. Fallback to `gemini-2.5-pro` for reasoning or if others are unavailable.

### Token & Cost Tracking
Every operation is logged via `ai-usage-tracker.js`.
- **Transparency**: A summary comment is posted/updated on every issue with the total USD cost.
- **Project Board**: The "Cost" field in the GitHub Project is updated automatically.
