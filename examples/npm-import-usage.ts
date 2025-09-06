/**
 * Example of using the npm import API programmatically
 */

import { withNpmImports, evalWithNpm, NpmImportMiddleware } from "tscircuit"

// Example 1: Process code with npm imports for CLI
async function example1() {
  const userCode = `
    import lodash from "lodash"
    import { Circuit, Resistor } from "@tscircuit/core"
    
    const values = lodash.range(1, 5)
    
    export default function MyCircuit() {
      return (
        <Circuit>
          {values.map(v => (
            <Resistor key={v} name={\`R\${v}\`} resistance="1k" />
          ))}
        </Circuit>
      )
    }
  `

  // Process for CLI environment
  const result = await withNpmImports({
    code: userCode,
    environment: 'cli',
    baseDir: process.cwd(),
    validate: true,
  })

  console.log('Processed code:', result.code)
  console.log('Found imports:', result.imports)
}

// Example 2: Process code for web with CDN
async function example2() {
  const userCode = `
    import React from "react"
    import axios from "axios"
    
    async function fetchData() {
      const response = await axios.get('/api/data')
      return response.data
    }
  `

  // Process for web environment with Skypack CDN
  const result = await withNpmImports({
    code: userCode,
    environment: 'web',
    cdnProvider: 'skypack',
  })

  console.log('Web-ready code:', result.code)
  // Output will have: import React from "https://cdn.skypack.dev/react"
}

// Example 3: Using the middleware pattern
async function example3() {
  const middleware = new NpmImportMiddleware({
    environment: 'auto', // Auto-detect CLI vs web
    cdnProvider: 'esm',   // Use esm.sh for web
  })

  const transformer = middleware.createTransformer()
  
  const userCode = `import dayjs from "dayjs"`
  const processed = await transformer(userCode)
  
  console.log('Transformed:', processed)
}

// Example 4: Evaluate code with npm imports directly
async function example4() {
  const code = `
    import { sum } from "lodash"
    
    const result = sum([1, 2, 3, 4])
    console.log("Sum:", result)
    
    export default result
  `

  // This will handle npm imports and evaluate the code
  const result = await evalWithNpm(code, {
    environment: 'cli',
    baseDir: process.cwd(),
  })

  console.log('Evaluation result:', result)
}

// Example 5: Generate import map for web
import { createImportMap, injectImportMap } from "tscircuit"

function example5() {
  const code = `
    import React from "react"
    import lodash from "lodash"
    import axios from "axios"
  `

  // Generate import map
  const importMap = createImportMap(code, 'jsdelivr')
  console.log('Import map:', importMap)
  // Output: {
  //   imports: {
  //     "react": "https://cdn.jsdelivr.net/npm/react",
  //     "lodash": "https://cdn.jsdelivr.net/npm/lodash",
  //     "axios": "https://cdn.jsdelivr.net/npm/axios"
  //   }
  // }

  // Inject into HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>My App</title></head>
      <body></body>
    </html>
  `
  
  const htmlWithImportMap = injectImportMap(html, importMap)
  console.log('HTML with import map:', htmlWithImportMap)
}

// Run examples
if (import.meta.main) {
  console.log('=== Example 1: CLI Processing ===')
  await example1()
  
  console.log('\n=== Example 2: Web Processing ===')
  await example2()
  
  console.log('\n=== Example 3: Middleware Pattern ===')
  await example3()
  
  console.log('\n=== Example 5: Import Maps ===')
  example5()
}