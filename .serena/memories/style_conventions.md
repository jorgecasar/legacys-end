# Style & Conventions

## Code Style
- **Indentation**: Tabs (Biome standard).
- **Quotes**: Double Quotes.
- **Semicolons**: Always used.
- **Trailing Commas**: Always used.
- **Naming**: 
  - Classes: PascalCase.
  - Variables/Functions: camelCase.
  - Booleans: prefixed with `is`, `has`, `can`.
  - Event Handlers: prefixed with `handle`.
  - Private Members: use `#private` syntax.

## Lit Standards
- **Decorators**: Use standard TC39 Decorators.
- **Properties**: Use `accessor` keyword for decorated fields.
- **Styles**: Separate styles into `[ComponentName].styles.js`.
- **Template**: Use declarative Lit templates.

## Error Handling
- **Result Pattern**: Use the `Result` class from `src/core/errors.js` for all domain and use case logic.
- **Exceptions**: Only for unexpected system failures, never for business logic.

## Documentation
- Use JSDoc for types and documentation.
- Maintain `GEMINI.md` rules if present.
