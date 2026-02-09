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

## Considered Options & Model Evaluation

The following models were evaluated based on official Google AI Studio / Cloud pricing and quota data for February 2026 (Free Tier estimates):

| Model | Series | Cost (Input/Output per 1M) | RPM (Requests/Min) | RPD (Requests/Day) | Reasoning Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`gemini-3-pro-preview`** | 3 | $2.00 / $12.00 | 2 | 50 | Ultra High |
| **`gemini-3-flash-preview`** | 3 | $0.50 / $3.00 | 15 | 1,500 | High |
| **`gemini-2.5-pro`** | 2.5 | $1.25 / $5.00 | 2 | 50 | Very High |
| **`gemini-2.5-flash`** | 2.5 | $0.10 / $0.40 | 15 | 1,500 | Medium-High |
| **`gemini-2.5-flash-lite`** | 2.5 | $0.05 / $0.20 | 30 | 2,000 | Low-Medium |
| **`gemini-2.0-flash`** | 2.0 | $0.10 / $0.40 | 15 | 1,500 | Medium (Stable) |

## Decision Outcome

Chosen option: **Option 3: Automated Triage with Auto-Fallback**, implementing a tiered model hierarchy.

### Justification & Final Argument

The decision is driven by the fact that **Gemini quotas are independent per model series**. By implementing a triage system, we achieve three critical objectives:

1.  **Total Daily Throughput**: Using a single model would limit the agent to ~1,500 requests per day. By spreading tasks across Gemini 3, 2.5, and 2.0 series, we effectively triple the project's capacity to ~4,500-5,000 automated requests per day.
2.  **Strategic Reasoning**: High-reasoning models (Pro series) have extremely low RPD (50). We reserve these scarce "Pro" credits exclusively for complex architectural or logical changes, while using the virtually infinite "Flash" credits for standard features and bug fixes.
3.  **Zero-Stop Resilience**: The auto-fallback logic ensures that the "Auto-Pilot" never halts. If the premium `3-pro` quota is exhausted, the system seamlessly downgrades to `3-flash` or `2.5-pro`. While quality may slightly vary, the progress of the task is never interrupted by technical limits.

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