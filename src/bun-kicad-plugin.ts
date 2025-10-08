import { processFileWithHandler } from "./filetype-handlers"
import type { PlatformConfig } from "./filetype-handlers"

interface BunPlugin {
  name: string
  setup: (build: any) => void
}

export function createKicadImportPlugin(platformConfig?: PlatformConfig): BunPlugin {
  return {
    name: "kicad-import-plugin",
    setup(build: any) {
      build.onLoad({ filter: /\.kicad_mod$/ }, async (args: any) => {
        try {
          const fileContent = await Bun.file(args.path).text()
          const circuitJson = await processFileWithHandler(fileContent, args.path, platformConfig)
          return {
            exports: {
              default: circuitJson,
              footprintCircuitJson: circuitJson
            },
            loader: "object"
          }
        } catch (error) {
          throw new Error(`Failed to process KiCad file ${args.path}: ${error}`)
        }
      })
    }
  }
}

export function registerKicadPlugin(platformConfig?: PlatformConfig) {
  if (typeof Bun !== "undefined" && (Bun as any).plugin) {
    const plugin = createKicadImportPlugin(platformConfig)
    return plugin
  }
  return null
}
