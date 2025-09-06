import { withNpmImports, createImportMap } from './with-npm-imports'

/**
 * Enhanced eval function that supports npm imports
 * This wraps the existing @tscircuit/eval functionality with npm import resolution
 */
export async function evalWithNpm(
  code: string,
  options?: {
    environment?: 'cli' | 'web' | 'auto'
    baseDir?: string
    cdnProvider?: 'skypack' | 'jsdelivr' | 'unpkg' | 'esm'
  }
): Promise<any> {
  // Process the code to handle npm imports
  const processed = await withNpmImports({
    code,
    environment: options?.environment,
    baseDir: options?.baseDir,
    cdnProvider: options?.cdnProvider,
    validate: true,
  })

  // For now, return the processed code
  // The actual evaluation would be handled by @tscircuit/eval
  // which needs to be updated to support the processed code
  return {
    processedCode: processed.code,
    imports: processed.imports,
    environment: processed.environment,
    message: 'Code processed with npm imports. Ready for evaluation.'
  }
}

/**
 * Create a web worker that supports npm imports
 */
export function createNpmWebWorker(options?: {
  cdnProvider?: 'skypack' | 'jsdelivr' | 'unpkg' | 'esm'
}): Worker {
  const workerCode = `
    import { withNpmImports } from '/src/with-npm-imports.js';
    
    self.addEventListener('message', async (event) => {
      const { code, id } = event.data;
      
      try {
        // Process code with npm imports
        const processed = await withNpmImports({
          code,
          environment: 'web',
          cdnProvider: '${options?.cdnProvider || 'skypack'}'
        });
        
        // Evaluate the processed code
        const result = await eval(processed.code);
        
        self.postMessage({ id, result });
      } catch (error) {
        self.postMessage({ id, error: error.message });
      }
    });
  `

  const blob = new Blob([workerCode], { type: 'application/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  return new Worker(workerUrl, { type: 'module' })
}

/**
 * Hook for integrating npm imports into the existing tscircuit build pipeline
 */
export class NpmImportHook {
  constructor(
    private options?: {
      environment?: 'cli' | 'web' | 'auto'
      baseDir?: string
      cdnProvider?: 'skypack' | 'jsdelivr' | 'unpkg' | 'esm'
    }
  ) {}

  /**
   * Pre-process hook for handling npm imports before evaluation
   */
  async preProcess(code: string): Promise<string> {
    const result = await withNpmImports({
      ...this.options,
      code,
    })
    return result.code
  }

  /**
   * Generate import map for web usage
   */
  generateImportMap(code: string): { imports: Record<string, string> } {
    return createImportMap(code, this.options?.cdnProvider)
  }

  /**
   * Check if code has npm imports that need processing
   */
  hasNpmImports(code: string): boolean {
    // Simple check for import statements that aren't relative or @tscircuit
    const importRegex = /import\s+.*from\s+['"](?![./@tscircuit])([^'"]+)['"]/
    return importRegex.test(code)
  }
}