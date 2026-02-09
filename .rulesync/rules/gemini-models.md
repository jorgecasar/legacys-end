# Gemini Models Rule (Feb 2026)

This rule defines the available Gemini models, their capabilities, and the selection logic for AI agents in this project. 

## Model Matrix (Feb 2026)

| Model ID | Series | Intelligence & Use Case | Key Features |
| :--- | :--- | :--- | :--- |
| **`gemini-3-pro-preview`** | Gemini 3 | **State-of-the-art Intelligence**. Deep interactive reasoning, agentic tasks, and complex multimodal understanding. | Thinking, Function Calling, Code Execution, Massive Output (64K). |
| **`gemini-3-flash-preview`** | Gemini 3 | **Frontier Intelligence + Speed**. Balanced for scale and performance with Gemini 3 reasoning. | Thinking, Function Calling, Search Grounding, Low Latency. |
| **`gemini-2.5-pro`** | Gemini 2.5 | **Complex Coding & Math**. Best for reasoning over large datasets, codebases, and docs using long context. | Thinking, File Search, Advanced Tool Use, Stable. |
| **`gemini-2.5-flash`** | Gemini 2.5 | **Price-Performance Champion**. Ideal for high-volume tasks, large-scale processing, and thinking at scale. | Thinking, Grounding (Maps/Search), Code Execution, Fast. |
| **`gemini-2.5-flash-lite`** | Gemini 2.5 | **Cost-Efficiency & Scale**. Optimized for highest throughput and lowest cost. | Fast, Reliable, Best for simple/trivial automation. |
| **`gemini-2.0-flash`** | Gemini 2.0 | **Legacy Workhorse** (Available until March 31, 2026). Native tool use and 1M context. | Native Tool Use, Grounding, 8K Output limit. |
| **`gemini-2.0-flash-lite`** | Gemini 2.0 | **Low Latency legacy** (Available until March 31, 2026). Cost-optimized for real-time needs. | Function Calling, Grounding, Structured Outputs. |

## Selection Logic (Triage)

Agents MUST select models based on the following criteria:

1. **TRIVIAL** (Docs, README, CSS): `gemini-2.5-flash-lite`
2. **MICRO** (Single fixes, renames): `gemini-2.0-flash-lite` (or `2.5-flash-lite`)
3. **SIMPLE** (Standard bugs, UI): `gemini-2.5-flash` or `gemini-3-flash-preview`
4. **MEDIUM** (New features, unit tests): `gemini-2.5-pro`
5. **COMPLEX** (Algorithms, Core Logic): `gemini-3-pro-preview`
6. **CRITICAL** (Arch, Security, Migrations): `gemini-3-pro-preview`

## Operational Guidelines

- **Default Triage Model**: Always use `gemini-3-flash-preview` for analyzing issues.
- **Quota Management**: Prioritize `Flash` models for throughput. Reserve `Pro` for high-reasoning requirements.
- **Persistence**: Model selection must be stored in the GitHub Issue label `model:MODEL_ID`.
- **Context Limit**: Keep map-tokens around 1024 to respect TPM limits across all tiers.
