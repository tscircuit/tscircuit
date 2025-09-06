#!/usr/bin/env node

import { withNpmImports } from './with-npm-imports'
import { readFile, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

/**
 * CLI command to process tscircuit files with npm import support
 */
export async function processFileWithNpmImports(
  filePath: string,
  options?: {
    output?: string
    watch?: boolean
    baseDir?: string
  }
): Promise<void> {
  const resolvedPath = resolve(filePath)
  
  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`)
  }

  const code = await readFile(resolvedPath, 'utf-8')
  const baseDir = options?.baseDir || process.cwd()

  console.log(`Processing ${filePath} with npm import support...`)

  try {
    const result = await withNpmImports({
      code,
      environment: 'cli',
      baseDir,
      validate: true,
    })

    if (result.imports && result.imports.length > 0) {
      console.log(`Resolved imports: ${result.imports.join(', ')}`)
    }

    const outputPath = options?.output || resolvedPath.replace(/\.(ts|tsx|js|jsx)$/, '.bundled.js')
    await writeFile(outputPath, result.code)
    
    console.log(`✓ Output written to ${outputPath}`)
  } catch (error) {
    console.error(`Error processing file: ${error}`)
    process.exit(1)
  }
}

/**
 * Install missing npm dependencies detected in tscircuit code
 */
export async function installMissingDependencies(
  code: string,
  options?: {
    baseDir?: string
    packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  }
): Promise<void> {
  const { NpmImportResolver } = await import('./npm-import-resolver')
  const resolver = new NpmImportResolver()
  
  const imports = resolver.extractImports(code)
  const baseDir = options?.baseDir || process.cwd()
  
  const validation = await resolver.validateImports(imports, baseDir)
  
  if (validation.missing.length === 0) {
    console.log('All dependencies are already installed')
    return
  }

  const packageManager = options?.packageManager || detectPackageManager()
  const installCommand = getInstallCommand(packageManager, validation.missing)
  
  console.log(`Missing packages: ${validation.missing.join(', ')}`)
  console.log(`Running: ${installCommand}`)
  
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  try {
    await execAsync(installCommand, { cwd: baseDir })
    console.log('✓ Dependencies installed successfully')
  } catch (error) {
    console.error('Failed to install dependencies:', error)
    process.exit(1)
  }
}

/**
 * Detect which package manager is being used
 */
function detectPackageManager(): 'npm' | 'yarn' | 'pnpm' | 'bun' {
  if (existsSync('bun.lockb')) return 'bun'
  if (existsSync('pnpm-lock.yaml')) return 'pnpm'
  if (existsSync('yarn.lock')) return 'yarn'
  return 'npm'
}

/**
 * Get the install command for the package manager
 */
function getInstallCommand(
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun',
  packages: string[]
): string {
  const packageList = packages.join(' ')
  
  switch (packageManager) {
    case 'bun':
      return `bun add ${packageList}`
    case 'pnpm':
      return `pnpm add ${packageList}`
    case 'yarn':
      return `yarn add ${packageList}`
    default:
      return `npm install ${packageList}`
  }
}

/**
 * CLI integration for the tsci command
 */
export async function extendTsciWithNpmSupport(): Promise<void> {
  // This function would be called by @tscircuit/cli to add npm support
  // It provides hooks and middleware for processing imports
  
  const hook = await import('./eval-with-npm').then(m => m.NpmImportHook)
  const npmHook = new hook({
    environment: 'cli',
    baseDir: process.cwd(),
  })

  // Register the hook with the CLI
  // This would integrate with @tscircuit/cli's plugin system
  return {
    name: 'npm-import-support',
    
    // Pre-process user code before evaluation
    async preProcess(code: string): Promise<string> {
      if (npmHook.hasNpmImports(code)) {
        return npmHook.preProcess(code)
      }
      return code
    },

    // Command to process files with npm imports
    commands: {
      'bundle': {
        description: 'Bundle a tscircuit file with npm imports',
        action: processFileWithNpmImports,
      },
      'install-deps': {
        description: 'Install missing npm dependencies',
        action: async (filePath: string) => {
          const code = await readFile(filePath, 'utf-8')
          await installMissingDependencies(code)
        },
      },
    },
  } as any
}