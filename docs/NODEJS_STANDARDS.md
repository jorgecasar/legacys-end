# Node.js Development Standards

## Runtime Version

**Required**: Node.js 24.x (LTS)

All scripts, tooling, and CI/CD workflows must use Node.js 24 to ensure access to the latest language features and optimal performance.

## Module System

**Required**: ES Modules (ESM)

- ✅ **Use**: `import`/`export` syntax
- ❌ **Avoid**: CommonJS (`require`/`module.exports`)

The project is configured with `"type": "module"` in `package.json`, enforcing ES modules across all JavaScript files.

### Examples

**Correct (ES Modules)**:
```javascript
// Importing
import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

// Exporting
export async function processFile(path) {
  const content = await readFile(path, 'utf-8');
  return content;
}

export default processFile;
```

**Incorrect (CommonJS)**:
```javascript
// ❌ Don't use this
const fs = require('fs');
module.exports = { processFile };
```

## Modern JavaScript Features

Leverage the latest ECMAScript features supported by Node.js 24:

### Recommended Features

1. **Top-level `await`**
   ```javascript
   // No need for async IIFE
   const data = await fetch('https://api.example.com');
   ```

2. **Optional Chaining & Nullish Coalescing**
   ```javascript
   const value = obj?.deeply?.nested?.property ?? 'default';
   ```

3. **Array and Object Methods**
   ```javascript
   // Array.prototype.at()
   const last = array.at(-1);
   
   // Object.hasOwn()
   if (Object.hasOwn(obj, 'key')) { }
   ```

4. **Template Literals for Multiline Strings**
   ```javascript
   const query = `
     SELECT * FROM users
     WHERE active = true
   `;
   ```

5. **Destructuring with Defaults**
   ```javascript
   export async function main(
     issueNumber = process.env.ISSUE_NUMBER,
     { exec = execSync } = {}
   ) { }
   ```

6. **`node:` Protocol for Built-in Modules**
   ```javascript
   // ✅ Preferred
   import { readFile } from 'node:fs/promises';
   
   // ❌ Avoid
   import { readFile } from 'fs/promises';
   ```

## File Extensions

- Use `.js` for all JavaScript files (ES modules)
- Use `.test.js` for test files
- No need for `.mjs` since `"type": "module"` is set

## Script Execution

### Direct Execution
```javascript
// Add shebang for executable scripts
#!/usr/bin/env node

// Check if script is being run directly
import { fileURLToPath } from 'node:url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

### CI/CD Workflows

All GitHub Actions workflows use Node.js 24:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "24"
```

## Testing

Use Node.js built-in test runner for tooling scripts:

```bash
node --test --test-reporter=spec tooling/*.test.js
```

For application code, use Vitest (configured for ES modules).

## References

- [Node.js 24 Documentation](https://nodejs.org/docs/latest-v24.x/api/)
- [ES Modules in Node.js](https://nodejs.org/api/esm.html)
- [ECMAScript 2024 Features](https://github.com/tc39/proposals/blob/main/finished-proposals.md)
