# NPM Import Support for tscircuit

This feature enables importing npm packages in tscircuit code for both CLI and web (tscircuit.com) environments.

## Overview

The npm import system automatically:
- Bundles dependencies for CLI usage
- Transforms imports to CDN URLs for web usage
- Preserves `@tscircuit/*` imports as-is
- Supports all major CDN providers

## Basic Usage

### In Your Circuit Code

```tsx
// Import any npm package
import lodash from "lodash"
import { format } from "date-fns"

// Import tscircuit components as usual
import { Circuit, Resistor } from "@tscircuit/core"

export default function MyCircuit() {
  const values = lodash.range(1, 5)
  
  return (
    <Circuit>
      {values.map(v => (
        <Resistor key={v} name={`R${v}`} resistance="1k" />
      ))}
    </Circuit>
  )
}
```

### CLI Usage

```bash
# Install dependencies locally
npm install lodash date-fns

# Run your circuit
tsci dev my-circuit.tsx
```

### Web Usage (tscircuit.com)

No installation needed! Imports are automatically resolved from CDN.

## API Reference

### `withNpmImports(options)`

Process code with npm import support.

```ts
const result = await withNpmImports({
  code: userCode,
  environment: 'cli' | 'web' | 'auto',
  baseDir: '/path/to/project',
  cdnProvider: 'skypack' | 'jsdelivr' | 'unpkg' | 'esm',
  validate: true
})
```

### `evalWithNpm(code, options)`

Evaluate code with npm imports directly.

```ts
const result = await evalWithNpm(code, {
  environment: 'cli',
  baseDir: process.cwd(),
  cdnProvider: 'skypack'
})
```

### `createImportMap(code, cdnProvider)`

Generate an import map for native browser ES modules.

```ts
const importMap = createImportMap(code, 'skypack')
// Returns: { imports: { "lodash": "https://cdn.skypack.dev/lodash" } }
```

### `NpmImportMiddleware`

Middleware pattern for processing multiple files.

```ts
const middleware = new NpmImportMiddleware({
  environment: 'auto',
  cdnProvider: 'esm'
})

const transformer = middleware.createTransformer()
const processed = await transformer(code)
```

## CDN Providers

| Provider | URL | Best For |
|----------|-----|----------|
| `skypack` | cdn.skypack.dev | Modern browsers, optimized builds |
| `jsdelivr` | cdn.jsdelivr.net | Fast, reliable, good caching |
| `unpkg` | unpkg.com | Simple, direct npm mirror |
| `esm` | esm.sh | TypeScript support, modern syntax |

## Environment Detection

- **CLI**: Uses local node_modules and bundles dependencies
- **Web**: Transforms imports to CDN URLs
- **Auto**: Detects based on `typeof window`

## Validation

When `validate: true`, the system will:
1. Check if packages are installed (CLI only)
2. Warn about missing dependencies
3. Suggest install commands

## Examples

### Method Chaining Utility

```tsx
import { chain } from "lodash"

const resistorChain = chain([1000, 2000, 3000])
  .map(r => ({ name: `R${r}`, resistance: `${r}ohm` }))
  .value()

export default function Circuit() {
  return (
    <Circuit>
      {resistorChain.map(props => <Resistor {...props} />)}
    </Circuit>
  )
}
```

### Using Date Libraries

```tsx
import dayjs from "dayjs"

const timestamp = dayjs().format('YYYY-MM-DD')

export default function DatedCircuit() {
  return (
    <Circuit>
      <text name="timestamp" value={timestamp} />
    </Circuit>
  )
}
```

### Mathematical Operations

```tsx
import { evaluate } from "mathjs"

const resistance = evaluate("2 * 10^3") // 2kΩ

export default function CalculatedCircuit() {
  return (
    <Circuit>
      <Resistor resistance={`${resistance}ohm`} />
    </Circuit>
  )
}
```

## Limitations

- Dynamic imports must be transformed before runtime
- Some Node.js-specific packages won't work in web environment
- CDN availability depends on package being published to npm

## Troubleshooting

### Missing Dependencies (CLI)

```bash
# If you see "Missing npm packages: lodash, axios"
npm install lodash axios
```

### CDN Loading Issues (Web)

Try a different CDN provider:

```ts
await withNpmImports({
  code,
  environment: 'web',
  cdnProvider: 'jsdelivr' // Try different provider
})
```

### TypeScript Types

Install type definitions for better IDE support:

```bash
npm install --save-dev @types/lodash @types/date-fns
```