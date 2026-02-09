# CI Efficiency Rule

To save GitHub Actions minutes and optimize the feedback loop, all agents (including the current one) MUST follow these commit guidelines:

## When to use [skip ci]

Add `[skip ci]` to the commit message for any change that **does not affect the production deployment**. This includes:
1.  **Documentation**: Any `*.md` files.
2.  **Workflows & Automation**: `.github/workflows/` and `.github/scripts/`.
3.  **Internal Rules**: `.rulesync/` rules and `.gemini/` skills.
4.  **Local Config**: `.gitignore`, `.lintstagedrc`, `.biome.json`, etc.
5.  **Test-only changes**: New or updated test files that do not touch production code.
6.  **Intermediate Work**: Any "WIP" commit during rate-limit pauses.

## When NOT to use [skip ci]

**DO NOT** add `[skip ci]` if the changes include:
- Any file inside `src/` (excluding tests).
- Any file inside `public/`.
- `index.html`.
- Production dependencies changes in `package.json`.
- Build configuration (`vite.config.js`) that affects the production output.

## Implementation Standard

Every time the agent (manual or automatic) performs a commit, it must evaluate if the files staged for commit require a new deployment. If they don't, the suffix `[skip ci]` must be appended to the commit message.
