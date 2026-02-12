# Tooling Directory

This directory contains all AI automation and GitHub integration scripts for the project.

## Directory Structure

```
tooling/
├── ai-orchestration/        # Workflow orchestration and coordination
│   ├── agent-flow.js        # Main entry point for the AI agent workflow
│   ├── orchestrator.js       # Orchestrates execution of planning → development → sync
│   ├── triage-orchestrator.js # Coordinates issue triage
│   └── triage-sync.js        # Syncs triage results to GitHub
│
├── ai-workers/              # Individual task workers
│   ├── plan.js              # Creates technical plans for issues
│   ├── develop.js           # Implements code changes based on plans
│   └── sync.js              # Aggregates results and updates project
│
├── config/                  # Configuration and constants
│   └── index.js             # Central config (OWNER, REPO, PROJECT_ID, etc.)
│
├── gemini/                  # Google Gemini AI integration
│   ├── index.js             # Main Gemini API wrapper with fallback chains
│   ├── pricing.js           # Pricing table and cost calculations
│   └── triage.js            # Issue triage logic using Gemini
│
├── github/                  # GitHub API utilities
│   ├── index.js             # Core GitHub utilities (Octokit setup, project updates)
│   └── client.js            # GitHub issue relationships and subtask management
│
└── monitoring/              # Usage tracking and reporting
    ├── usage-tracker.js     # Tracks AI token usage and costs per issue
    └── coverage.js          # Manages test coverage reports
```

## Key Modules

### `ai-orchestration/agent-flow.js`
Main entry point. Orchestrates the full workflow:
1. **Triage** - Analyze and categorize issues
2. **Plan** - Generate technical plans
3. **Develop** - Implement solutions
4. **Sync** - Report results and update GitHub

**Usage:**
```bash
node tooling/ai-orchestration/agent-flow.js --issue <number> [--skip-ai]
```

### `config/index.js`
Centralizes all configuration constants:
- GitHub repository info (OWNER, REPO, PROJECT_ID)
- Project field IDs and option IDs
- Helper functions for GitHub Actions integration

### `github/client.js`
Manages GitHub issue relationships:
- `ISSUE_RELATIONSHIP_TYPE` - Enum for relationship types (BLOCKS, BLOCKED_BY, TRACKS, TRACKED_BY)
- `createIssueRelationship()` - Creates formal relationships between issues
- `markIssueAsBlockedBy()` - Helper to mark blocking relationships
- `createSubtasks()` - Creates subtasks with parent relationships

### `gemini/index.js`
AI model integration with automatic fallback:
- `runWithFallback()` - Executes Gemini API with intelligent model fallback
- Supports structured JSON output via schemas
- Automatic retries and error handling

### `monitoring/usage-tracker.js`
Tracks AI API usage:
- Accumulates token usage across all AI operations
- Updates GitHub Projects with cost fields
- Posts detailed usage reports as issue comments

## Import Patterns

All modules use relative imports from their locations.

**Example from `ai-workers/plan.js`:**
```javascript
import { OWNER, REPO } from "../config/index.js";
import { runWithFallback } from "../gemini/index.js";
import { getOctokit, createSubtasks } from "../github/index.js";
```

**Example from `ai-orchestration/agent-flow.js`:**
```javascript
import { orchestrateExecution } from "./orchestrator.js";
import { createTechnicalPlan } from "../ai-workers/plan.js";
import { runWithFallback } from "../gemini/index.js";
```

## Testing

Run tests from project root:
```bash
npm run test:tooling              # All tooling tests
npm run test:tooling:coverage     # With coverage report
```

Tests are located alongside source files with `.test.js` suffix.

## Adding New Modules

When adding new functionality:
1. Choose the appropriate directory based on responsibility
2. Use relative imports (`../module/file.js`)
3. Export functions as named exports
4. Add JSDoc comments for public APIs
5. Create `.test.js` file for unit tests

## Related Files

- `.github/workflows/ai-worker.yml` - GitHub Actions workflow that calls these scripts
- `package.json` - Scripts for running and testing
