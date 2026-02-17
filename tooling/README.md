# AI Agent Tooling

Autonomous pipeline for project management and software development using Gemini and GitHub.

## Structure

```text
tooling/
├── ai-orchestration/    # Governance & Flow Control
│   ├── triage.js        # Classifies and prioritizes the backlog
│   └── selection.js     # Selects and dispatches tasks to workers
├── ai-workers/          # Technical Execution (Autonomous Agents)
│   ├── plan.js          # Analyzes task and creates sub-issues if needed
│   ├── develop.js       # Implements changes in the codebase
│   └── sync.js          # Syncs execution results and costs to GitHub
├── gemini/              # AI Engine Adapters
│   ├── run-cli.js       # Robust wrapper for @google/gemini-cli
│   └── pricing.js       # Cost calculation and model fallbacks
├── github/              # Infrastructure Adapters
│   ├── index.js         # Core GitHub API operations
│   ├── triage-adapter.js # Maps AI decisions to GitHub Project fields
│   └── create-subissue.js # Utility for native sub-issue linking
└── monitoring/          # Observability
    └── usage-tracker.js # Token and cost auditing
```

## Workflows

### 1. Triage (`triage.js`)
Triggered manually or via schedule. Evaluates all open issues and assigns:
- **Priority**: P0 (Critical) to P2 (Low).
- **Type**: Epic, Task, or Bug.
- **Project Fields**: Updates the Project V2 board.

### 2. Execution Orchestration (`execution.js`)
Runs hourly. Analyzes the board hierarchy to find "leaf" tasks (open issues with no open children) and dispatches them to the Workers.

### 3. Task Execution (`plan.js` & `develop.js`)
The core loop for solving a specific issue:
1. **Plan**: Decides whether to decompose the task or implement it directly.
2. **Develop**: Executes code changes, runs tests, and prepares a PR.
3. **Sync**: Records the total session cost in the project board.

## Configuration

Requires `.env` with:
- `GH_TOKEN`: GitHub PAT with repo and project scopes.
- `GEMINI_API_KEY`: Google AI Studio API key.
