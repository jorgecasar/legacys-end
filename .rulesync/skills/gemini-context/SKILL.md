---
name: gemini-context
description: >-
  Guidelines for using the correct Gemini models and managing AI context
  according to Feb 2026 standards.
---
# Gemini Context Skill

This skill ensures that all AI agents in the project use the appropriate Gemini models and respect the established quota management strategies.

## Available Models (Feb 2026)

- **`gemini-3-pro-preview`**: State-of-the-art reasoning for architectural and agentic tasks.
- **`gemini-3-flash-preview`**: Frontier intelligence balanced with speed for most dev tasks.
- **`gemini-2.5-pro`**: Stable reasoning for complex coding and long context.
- **`gemini-2.5-flash`**: Price-performance champion for high-volume thinking.
- **`gemini-2.5-flash-lite`**: Fastest model for trivial tasks and documentation.
- **`gemini-2.0-flash`**: Legacy workhorse (valid until March 31, 2026).

## Model Capabilities for Decision Making

- **Thinking**: Available in Gemini 3 and 2.5 series. Use for tasks requiring deliberate reasoning.
- **Function Calling**: Native support in all active models.
- **Context Window**: 1M+ tokens across most models (except 2.0-flash-lite).

## Context Management

1. **Tokens**: Aim for a maximum of 1024 map-tokens during Aider execution to prevent TPM (Tokens Per Minute) exhaustion.
2. **Persistence**: Use the `model:MODEL_ID` label on GitHub Issues to persist model selection.
3. **Triage**: Use `gemini-3-flash-preview` to perform a triage of task complexity.
