# 0002. Automated AI Triage and Model Hierarchy

> **Status**: Accepted
> **Date**: 2026-02-09
> **Deciders**: jorgecasar, AI Agent

## Context and Problem Statement

The project uses multiple AI agents for automated development (AI Pilot). Different tasks require different levels of reasoning, and each Gemini model has specific quota limits (RPM, TPM, RPD). Using a high-reasoning model for trivial tasks wastes daily quota, while using a lightweight model for complex architectural changes leads to poor code quality.

How can we optimize the use of AI models to ensure high-quality output while maximizing the number of tasks processed per day?

## Decision Drivers

*   **Reasoning Quality**: Complex tasks need advanced logic (Gemini 3 Pro).
*   **Quota Management**: Daily limits (RPD) are per model; using multiple models increases total daily throughput.
*   **Latency and Speed**: Trivial tasks should be nearly instantaneous.
*   **Cost Efficiency**: Lightweight models are significantly cheaper (or free).
*   **Resilience**: The system should not stop if a single model reaches its rate limit.

## Considered Options

*   **Option 1: Single Model**: Use a single powerful model (e.g., Gemini 3 Pro) for everything.
*   **Option 2: Static Mapping**: Assign models based on labels manually.
*   **Option 3: Automated Triage with Auto-Fallback**: An automated step analyzes the task complexity and assigns the best model, with dynamic fallback if rate limited.

## Decision Outcome

Chosen option: **Option 3: Automated Triage with Auto-Fallback**, because it provides the best balance between quality, reliability, and quota optimization.

### Hierarchy Definition (Feb 2026)

| Tier | Model ID | Use Case |
| :--- | :--- | :--- |
| **COMPLEX** | `gemini-3-pro-preview` | Architecture, Security, Algorithms. |
| **STANDARD** | `gemini-3-flash-preview` | General features and bug fixes. |
| **STABLE** | `gemini-2.0-flash` | GA model for reliable daily work. |
| **TRIVIAL** | `gemini-2.5-flash-lite` | Documentation and minor CSS changes. |

### Fallback Strategy

1.  **RPM/TPM (Temporary)**: Wait 30-60s and retry (up to 3 times).
2.  **RPD (Daily Quota)**: If the primary model is exhausted, automatically attempt the task with the next capable model in the hierarchy (e.g., fallback from 3-Pro to 3-Flash).

### Implementation Details

*   **Persistence**: Selection is stored in GitHub Labels (`model:MODEL_ID`) to avoid redundant triage.
*   **Technology**: Implemented in Node.js 24 using ES Modules and native `fetch` for GraphQL/REST API interaction.
*   **Environment**: Uses `PROJECT_PAT` for cross-context project permissions in personal accounts.

## Pros and Cons of the Options

### Option 3: Automated Triage with Auto-Fallback
*   Good, because it maximizes daily task throughput by using multiple independent quotas.
*   Good, because it ensures architectural tasks get the best possible reasoning.
*   Good, because it allows the "Auto-Pilot" to be resilient against 429 errors.
*   Bad, because it adds complexity to the CI/CD pipeline and utility scripts.
