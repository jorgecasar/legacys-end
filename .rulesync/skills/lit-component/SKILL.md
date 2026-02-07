---
name: lit-component
description: "Guidelines and boilerplate for creating Lit Web Components following project standards (accessor keyword, separate styles, signals)."
targets: ["*"]
---

# Lit Component Skill

This skill provides the standard workflow and boilerplate for creating new Web Components in Legacy's End using **Lit**.

## Standards Checklist

1.  **Decorators**: Use Standard TC39 decorators.
2.  **Accessor Keyword**: **MANDATORY**. All decorated fields must use `accessor`.
    *   *Bad*: `@state() name = "";`
    *   *Good*: `@state() accessor name = "";`
3.  **Style Separation**: Styles must live in a separate `[ComponentName].styles.js` file.
4.  **Signals**: Use `@lit-labs/signals` for shared reactive state.
5.  **Dumb Components**: Prefer receiving data via `@property` and emitting events.

## Workflow

1.  **Create Directory**: `src/components/[component-name]/`
2.  **Styles File**: Create `[ComponentName].styles.js` using the `css` tag.
3.  **Logic File**: Create `[ComponentName].js`.
4.  **Register**: Registrer the element using `@customElement`.

## Reference

For a complete boilerplate, see [references/boilerplate.md](references/boilerplate.md).