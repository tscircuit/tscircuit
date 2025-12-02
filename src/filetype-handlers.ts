import type { CircuitJson } from "circuit-json"

export interface FileTypeHandler {
  extensions: string[]
  handler: (content: string, filename: string) => CircuitJson | Promise<CircuitJson>
}

export interface PlatformConfig {
  filetypeHandlers?: FileTypeHandler[]
}

export const defaultFileTypeHandlers: FileTypeHandler[] = [
  {
    extensions: ["kicad_mod"],
    handler: async (content: string, filename: string): Promise<CircuitJson> => {
      const { parseKicadModToCircuitJson } = await import("kicad-component-converter")
      try {
        return parseKicadModToCircuitJson(content)
      } catch (error) {
        throw new Error(`Failed to parse KiCad file ${filename}: ${error}`)
      }
    }
  }
]

export function getFileTypeHandlers(platformConfig?: PlatformConfig): FileTypeHandler[] {
  const handlers = [...defaultFileTypeHandlers]
  if (platformConfig?.filetypeHandlers) {
    handlers.push(...platformConfig.filetypeHandlers)
  }
  return handlers
}

export function findHandlerForExtension(
  extension: string,
  platformConfig?: PlatformConfig
): FileTypeHandler | null {
  const handlers = getFileTypeHandlers(platformConfig)
  return handlers.find(handler => handler.extensions.includes(extension)) || null
}

export async function processFileWithHandler(
  content: string,
  filename: string,
  platformConfig?: PlatformConfig
): Promise<CircuitJson> {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension) {
    throw new Error(`Cannot determine file type for ${filename}`)
  }
  const handler = findHandlerForExtension(extension, platformConfig)
  if (!handler) {
    throw new Error(`No handler found for file type .${extension}`)
  }
  return await handler.handler(content, filename)
}
