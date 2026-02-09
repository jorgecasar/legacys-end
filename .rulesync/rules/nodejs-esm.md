# Node.js ES Modules Rule

This project uses ES modules for all Node.js code, including scripts.

## Standards

- **Node.js Version**: The project requires **Node.js 24** or higher.
- **ESNext Support**: Since we use Node.js 24, all supported **ESNext** features (Top-level await, stable features, etc.) are available and encouraged.
- **File Extension**: Use `.js` for all Node.js files.
- **Module System**: Always use ES modules (`import`/`export`). **DO NOT** use CommonJS (`require`/`module.exports`).
- **package.json**: The root `package.json` contains `"type": "module"`, which enforces ESM for all `.js` files.
- **Built-in Modules**: Always use the `node:` protocol when importing built-in Node.js modules (e.g., `import fs from "node:fs"`).

## Script Entry Point

For standalone scripts that need to detect if they are being run directly (the ESM equivalent of `require.main === module`), use the following pattern:

```javascript
import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Main execution logic
}
```

## Top-level Await

Since we are using ESM, top-level await is supported and should be used instead of wrapping code in async IIFEs where appropriate.
