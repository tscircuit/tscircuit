import { test, expect } from "bun:test"
import { withNpmImports, createImportMap, NpmImportResolver, WebImportTransformer } from "../src/with-npm-imports"

test("extract imports from code", () => {
  const resolver = new NpmImportResolver()
  
  const code = `
    import React from "react"
    import { useState } from "react"
    import lodash from "lodash"
    import { Circuit } from "@tscircuit/core"
    import "./local-file"
  `
  
  const imports = resolver.extractImports(code)
  
  expect(imports).toContain("react")
  expect(imports).toContain("lodash")
  expect(imports).not.toContain("@tscircuit/core")
  expect(imports).not.toContain("./local-file")
})

test("transform imports for CDN", () => {
  const transformer = new WebImportTransformer('skypack')
  
  const code = `
    import React from "react"
    import { Circuit } from "@tscircuit/core"
  `
  
  const transformed = transformer.transform(code)
  
  expect(transformed).toContain('https://cdn.skypack.dev/react')
  expect(transformed).toContain('@tscircuit/core') // Should not transform
})

test("create import map for web", () => {
  const code = `
    import React from "react"
    import lodash from "lodash"
  `
  
  const importMap = createImportMap(code, 'skypack')
  
  expect(importMap.imports).toHaveProperty('react')
  expect(importMap.imports).toHaveProperty('lodash')
  expect(importMap.imports['react']).toBe('https://cdn.skypack.dev/react')
})

test("process code with npm imports for web", async () => {
  const code = `
    import React from "react"
    
    export function MyComponent() {
      return React.createElement('div', null, 'Hello')
    }
  `
  
  const result = await withNpmImports({
    code,
    environment: 'web',
    cdnProvider: 'skypack',
  })
  
  expect(result.code).toContain('https://cdn.skypack.dev/react')
  expect(result.environment).toBe('web')
  expect(result.imports).toContain('react')
})

test("handle dynamic imports", () => {
  const transformer = new WebImportTransformer('esm')
  
  const code = `
    const module = await import("lodash")
  `
  
  const transformed = transformer.transform(code)
  
  expect(transformed).toContain('https://esm.sh/lodash')
})

test("multiple CDN providers", () => {
  const providers = ['skypack', 'jsdelivr', 'unpkg', 'esm'] as const
  
  const code = `import React from "react"`
  
  for (const provider of providers) {
    const transformer = new WebImportTransformer(provider)
    const transformed = transformer.transform(code)
    
    if (provider === 'skypack') {
      expect(transformed).toContain('https://cdn.skypack.dev/react')
    } else if (provider === 'jsdelivr') {
      expect(transformed).toContain('https://cdn.jsdelivr.net/npm/react')
    } else if (provider === 'unpkg') {
      expect(transformed).toContain('https://unpkg.com/react')
    } else if (provider === 'esm') {
      expect(transformed).toContain('https://esm.sh/react')
    }
  }
})