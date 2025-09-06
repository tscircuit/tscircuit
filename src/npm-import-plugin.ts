import type { Plugin } from 'esbuild'
import { createRequire } from 'node:module'
import { readFile } from 'fs/promises'

/**
 * ESBuild plugin for resolving npm imports in tscircuit user code
 */
export function npmImportPlugin(options?: {
  baseDir?: string
  allowList?: string[]
  blockList?: string[]
}): Plugin {
  const baseDir = options?.baseDir || process.cwd()
  const allowList = options?.allowList || []
  const blockList = options?.blockList || []

  return {
    name: 'npm-import-plugin',
    setup(build) {
      // Intercept import resolution
      build.onResolve({ filter: /.*/ }, async (args) => {
        // Skip relative imports and Node built-ins
        if (args.path.startsWith('.') || args.path.startsWith('node:')) {
          return null
        }

        // Always allow @tscircuit packages
        if (args.path.startsWith('@tscircuit/')) {
          return { external: true }
        }

        // Check block list
        if (blockList.length > 0) {
          for (const blocked of blockList) {
            if (args.path.startsWith(blocked)) {
              return {
                errors: [{
                  text: `Import of "${args.path}" is blocked`,
                  location: null,
                }],
              }
            }
          }
        }

        // Check allow list (if specified)
        if (allowList.length > 0) {
          let allowed = false
          for (const pattern of allowList) {
            if (args.path.startsWith(pattern)) {
              allowed = true
              break
            }
          }
          if (!allowed) {
            return {
              errors: [{
                text: `Import of "${args.path}" is not in the allow list`,
                location: null,
              }],
            }
          }
        }

        // Try to resolve the module
        try {
          const require = createRequire(baseDir + '/package.json')
          const resolved = require.resolve(args.path)
          return { path: resolved }
        } catch (e) {
          // Return null to let esbuild handle it
          return null
        }
      })

      // Load npm packages
      build.onLoad({ filter: /node_modules/ }, async (args) => {
        try {
          const contents = await readFile(args.path, 'utf8')
          return {
            contents,
            loader: args.path.endsWith('.json') ? 'json' : 'js',
          }
        } catch (e) {
          return {
            errors: [{
              text: `Failed to load ${args.path}: ${e}`,
              location: null,
            }],
          }
        }
      })
    },
  }
}

/**
 * Web-compatible import transformer that converts npm imports to CDN URLs
 */
export class WebImportTransformer {
  private cdnProviders = {
    skypack: 'https://cdn.skypack.dev/',
    jsdelivr: 'https://cdn.jsdelivr.net/npm/',
    unpkg: 'https://unpkg.com/',
    esm: 'https://esm.sh/',
  } as const

  constructor(
    private provider: keyof typeof WebImportTransformer.prototype.cdnProviders = 'skypack'
  ) {}

  /**
   * Transform import statements to use CDN URLs
   */
  transform(code: string): string {
    const cdnBase = this.cdnProviders[this.provider]
    
    // Regex patterns for different import styles
    const patterns = [
      // import { x } from 'package'
      /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
      // import x from 'package'
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      // import * as x from 'package'
      /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      // import 'package'
      /import\s+['"]([^'"]+)['"]/g,
    ]

    let transformedCode = code

    for (const pattern of patterns) {
      transformedCode = transformedCode.replace(pattern, (match, ...args) => {
        // Get the package name (last non-undefined arg before offset)
        const packageName = args[args.length - 3] || args[args.length - 2]
        
        // Skip transformation for relative imports and @tscircuit packages
        if (packageName.startsWith('.') || packageName.startsWith('@tscircuit/')) {
          return match
        }

        // Transform to CDN URL
        return match.replace(packageName, `${cdnBase}${packageName}`)
      })
    }

    // Handle dynamic imports
    transformedCode = transformedCode.replace(
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      (match, packageName) => {
        if (packageName.startsWith('.') || packageName.startsWith('@tscircuit/')) {
          return match
        }
        return `import("${cdnBase}${packageName}")`
      }
    )

    return transformedCode
  }

  /**
   * Generate import map for native browser ES modules
   */
  generateImportMap(packages: string[]): {
    imports: Record<string, string>
  } {
    const cdnBase = this.cdnProviders[this.provider]
    const imports: Record<string, string> = {}

    for (const pkg of packages) {
      if (!pkg.startsWith('.') && !pkg.startsWith('@tscircuit/')) {
        imports[pkg] = `${cdnBase}${pkg}`
      }
    }

    return { imports }
  }
}