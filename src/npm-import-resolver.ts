import * as esbuild from 'esbuild'
import { createRequire } from 'node:module'
import { readFile } from 'fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ResolvedModule {
  code: string
  dependencies: Map<string, ResolvedModule>
}

export interface NpmImportOptions {
  /**
   * Entry code that may contain import statements
   */
  code: string
  /**
   * Base directory for resolving modules (for CLI)
   */
  baseDir?: string
  /**
   * Whether to use CDN for web environment
   */
  useCDN?: boolean
  /**
   * CDN URL template (default: https://cdn.skypack.dev/)
   */
  cdnUrl?: string
}

/**
 * Resolves npm imports for both CLI and web environments
 */
export class NpmImportResolver {
  private resolvedModules: Map<string, ResolvedModule> = new Map()
  private cdnUrl: string = 'https://cdn.skypack.dev/'

  constructor(options?: { cdnUrl?: string }) {
    if (options?.cdnUrl) {
      this.cdnUrl = options.cdnUrl
    }
  }

  /**
   * Resolve imports in user code for CLI environment
   */
  async resolveForCLI(options: NpmImportOptions): Promise<string> {
    const { code, baseDir = process.cwd() } = options

    // Use esbuild to bundle the code with all dependencies
    const result = await esbuild.build({
      stdin: {
        contents: code,
        resolveDir: baseDir,
        loader: 'tsx',
      },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
      target: 'esnext',
      external: ['@tscircuit/*'], // Keep tscircuit packages external
      plugins: [
        {
          name: 'resolve-npm-imports',
          setup(build) {
            // Handle npm package imports
            build.onResolve({ filter: /^[^./]/ }, async (args) => {
              if (args.path.startsWith('@tscircuit/')) {
                return { external: true }
              }
              
              try {
                const require = createRequire(baseDir + '/package.json')
                const resolved = require.resolve(args.path)
                return { path: resolved }
              } catch (e) {
                // Let esbuild handle the error
                return null
              }
            })
          },
        },
      ],
    })

    if (result.outputFiles && result.outputFiles.length > 0) {
      return result.outputFiles[0].text
    }

    throw new Error('Failed to bundle code with npm imports')
  }

  /**
   * Resolve imports in user code for web environment
   */
  async resolveForWeb(options: NpmImportOptions): Promise<string> {
    const { code } = options

    // Transform import statements to use CDN
    const transformedCode = await this.transformImportsForCDN(code)

    // Use esbuild to bundle and transform
    const result = await esbuild.build({
      stdin: {
        contents: transformedCode,
        loader: 'tsx',
      },
      bundle: false, // Don't bundle for web, let browser handle CDN imports
      write: false,
      format: 'esm',
      platform: 'browser',
      target: 'esnext',
    })

    if (result.outputFiles && result.outputFiles.length > 0) {
      return result.outputFiles[0].text
    }

    return transformedCode
  }

  /**
   * Transform import statements to use CDN URLs
   */
  private async transformImportsForCDN(code: string): Promise<string> {
    // Regex to match import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g
    
    let transformedCode = code
    let match

    const replacements: Array<{ original: string; replacement: string }> = []

    while ((match = importRegex.exec(code)) !== null) {
      const fullMatch = match[0]
      const packageName = match[1]

      // Skip relative imports and tscircuit packages
      if (packageName.startsWith('.') || packageName.startsWith('@tscircuit/')) {
        continue
      }

      // Transform to CDN URL
      const cdnImport = fullMatch.replace(
        packageName,
        `${this.cdnUrl}${packageName}`
      )

      replacements.push({
        original: fullMatch,
        replacement: cdnImport,
      })
    }

    // Apply replacements
    for (const { original, replacement } of replacements) {
      transformedCode = transformedCode.replace(original, replacement)
    }

    return transformedCode
  }

  /**
   * Validate that imported packages are available
   */
  async validateImports(packageNames: string[], baseDir?: string): Promise<{
    valid: string[]
    missing: string[]
  }> {
    const valid: string[] = []
    const missing: string[] = []

    for (const pkg of packageNames) {
      try {
        if (baseDir) {
          const require = createRequire(baseDir + '/package.json')
          require.resolve(pkg)
        }
        valid.push(pkg)
      } catch (e) {
        missing.push(pkg)
      }
    }

    return { valid, missing }
  }

  /**
   * Extract import statements from code
   */
  extractImports(code: string): string[] {
    const imports: string[] = []
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g
    
    let match
    while ((match = importRegex.exec(code)) !== null) {
      const packageName = match[1]
      if (!packageName.startsWith('.') && !packageName.startsWith('@tscircuit/')) {
        imports.push(packageName)
      }
    }

    return [...new Set(imports)] // Remove duplicates
  }
}

/**
 * Convenience function to resolve npm imports based on environment
 */
export async function resolveNpmImports(
  code: string,
  options?: {
    environment?: 'cli' | 'web'
    baseDir?: string
    cdnUrl?: string
  }
): Promise<string> {
  const resolver = new NpmImportResolver({ cdnUrl: options?.cdnUrl })
  const environment = options?.environment || 'cli'

  if (environment === 'cli') {
    return resolver.resolveForCLI({ code, baseDir: options?.baseDir })
  } else {
    return resolver.resolveForWeb({ code })
  }
}