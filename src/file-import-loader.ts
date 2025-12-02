import { readFileSync } from "fs"
import type { CircuitJson } from "circuit-json"
import { processFileWithHandler } from "./filetype-handlers"
import type { PlatformConfig } from "./filetype-handlers"

export async function importFile(
  filePath: string,
  platformConfig?: PlatformConfig
): Promise<CircuitJson> {
  try {
    const content = readFileSync(filePath, 'utf-8')
    return await processFileWithHandler(content, filePath, platformConfig)
  } catch (error) {
    if ((error as any)?.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`)
    }
    throw error
  }
}

export function createFileModuleLoader(platformConfig?: PlatformConfig) {
  return async function loadFileModule(modulePath: string): Promise<CircuitJson> {
    const cleanPath = modulePath.replace(/^file:\/\//, '')
    return await importFile(cleanPath, platformConfig)
  }
}
