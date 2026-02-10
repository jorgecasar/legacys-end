# Code Style and Conventions
Follow the "Jorge Casar" developer persona: Senior Frontend Architect.

## General
- Indentation: Tabs
- Strings: Double quotes
- Semicolons: Yes
- Trailing commas: Yes

## JavaScript/Lit
- Use native `#privateField` for private members.
- Use `accessor` keyword for decorated fields (e.g., `@state() accessor name = ""`).
- Boolean naming: `is`, `has`, `can` prefixes.
- Event handlers: `handle` prefix.
- Prefer early returns to avoid nesting.
- Use Result Pattern for Use Cases and Services.
- Components should be "Dumb" (presentation only) when possible.
- Separate styles into `[ComponentName].styles.js`.
