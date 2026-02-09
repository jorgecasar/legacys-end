# Conventions & Style

## Code Style
- **Indentation**: Tabs (enforced by Biome).
- **Formatting**: Handled by `npm run format` (Biome).
- **Linting**: Strict (Biome + `lit-analyzer` + `tsc` strict mode).
- **Files**: `type: module` (ESM).

## Architectural Guidelines
- **Clean Architecture**: Respect layer boundaries. Domain should not import UI.
- **Components**:
  - Use `ts-lit-plugin` checks.
  - Separate styles into `.styles.js` (suggested by standard Lit patterns in this project context).
  - Use `accessor` for decorated fields (standard TC39 decorators).
- **Error Handling**: Result pattern is preferred (based on context hints).

## Version Control
- **Commits**: Conventional Commits (enforced by commitlint).
- **Hooks**: Husky (pre-commit, commit-msg).
