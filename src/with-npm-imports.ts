import { NpmImportResolver } from './npm-import-resolver'
import { WebImportTransformer } from './npm-import-plugin'

export interface WithNpmImportsOptions {
  /**
   * The code to process
   */
  code: string
  /**
   * Environment to target
   */
  environment?: 'cli' | 'web' | 'auto'
  /**
   * Base directory for resolving modules (CLI only)
   */
  baseDir?: string
  /**
   * CDN provider for web imports
   */
  cdnProvider?: 'skypack' | 'jsdelivr' | 'unpkg' | 'esm'
  /**
   * Custom CDN URL
   */
  cdnUrl?: string
  /**
   * Whether to validate imports before processing
   */
  validate?: boolean
}

/**
 * Process tscircuit code with npm import support
 */
export async function withNpmImports(options: WithNpmImportsOptions): Promise<{
  code: string
  imports?: string[]
  environment: 'cli' | 'web'
}> {
  const {
    code,
    environment = 'auto',
    baseDir,
    cdnProvider = 'skypack',
    cdnUrl,
    validate = false,
  } = options

  // Detect environment if auto
  const detectedEnv = environment === 'auto' 
    ? (typeof (globalThis as any).window !== 'undefined' ? 'web' : 'cli')
    : environment

  const resolver = new NpmImportResolver({ cdnUrl })

  // Extract imports from code
  const imports = resolver.extractImports(code)

  // Validate imports if requested
  if (validate && imports.length > 0 && detectedEnv === 'cli') {
    const validation = await resolver.validateImports(imports, baseDir)
    if (validation.missing.length > 0) {
      console.warn(`Missing npm packages: ${validation.missing.join(', ')}`)
      console.warn('Run: npm install ' + validation.missing.join(' '))
    }
  }

  let processedCode: string

  if (detectedEnv === 'cli') {
    // Use esbuild for CLI environment
    processedCode = await resolver.resolveForCLI({ code, baseDir })
  } else {
    // Use CDN transformation for web environment
    const transformer = new WebImportTransformer(cdnProvider)
    processedCode = transformer.transform(code)
  }

  return {
    code: processedCode,
    imports,
    environment: detectedEnv,
  }
}

/**
 * Create an import map for web environment
 */
export function createImportMap(code: string, cdnProvider: 'skypack' | 'jsdelivr' | 'unpkg' | 'esm' = 'skypack'): {
  imports: Record<string, string>
} {
  const resolver = new NpmImportResolver()
  const imports = resolver.extractImports(code)
  
  const transformer = new WebImportTransformer(cdnProvider)
  return transformer.generateImportMap(imports)
}

/**
 * Inject import map into HTML
 */
export function injectImportMap(html: string, importMap: { imports: Record<string, string> }): string {
  const importMapScript = `<script type="importmap">
${JSON.stringify(importMap, null, 2)}
</script>`

  // Insert before first script tag or at end of head
  if (html.includes('</head>')) {
    return html.replace('</head>', `${importMapScript}\n</head>`)
  } else if (html.includes('<script')) {
    return html.replace('<script', `${importMapScript}\n<script`)
  } else {
    return html + importMapScript
  }
}

/**
 * Middleware for processing tscircuit code with npm imports
 */
export class NpmImportMiddleware {
  private options: Omit<WithNpmImportsOptions, 'code'>

  constructor(options?: Omit<WithNpmImportsOptions, 'code'>) {
    this.options = options || {}
  }

  async process(code: string): Promise<string> {
    const result = await withNpmImports({
      ...this.options,
      code,
    })
    return result.code
  }

  /**
   * Create a function that can be used as a transformer
   */
  createTransformer(): (code: string) => Promise<string> {
    return async (code: string) => this.process(code)
  }
}

// Re-export for convenience
export { NpmImportResolver } from './npm-import-resolver'
export { WebImportTransformer } from './npm-import-plugin'