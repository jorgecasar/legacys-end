---
name: github-ops
description: Skill for interacting with GitHub issues, projects, and PRs using MCP.
---
# Skill: GitHub Operations (MCP)

## Purpose
This skill empowers agents to interact with GitHub issues, projects (V2), and pull requests using the Model Context Protocol (MCP).

## Instructions
- **Querying Issues**: Always list issues first to understand context/dependencies.
- **Project V2 Sincronization**: 
    - When a task starts, move it to "In Progress".
    - Update custom fields like "Priority" or "Complexity" using the project tools.
- **Sub-issue Management**: Use native GitHub relationships to link parent and child tasks.
- **PR Creation**: Use `gh pr create` via terminal if MCP doesn't support specific flags, otherwise use MCP tools.

## Key Tools
- `mcp_github-mcp-server_list_issues`
- `mcp_github-mcp-server_issue_read`
- `mcp_github-mcp-server_create_pull_request`

## Best Practices
- Always check if an issue is blocked by other tasks before starting work.
- Provide clear, markdown-formatted comments when updating issues.
