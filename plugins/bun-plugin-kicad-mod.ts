/**
 * Bun plugin for loading .kicad_mod files
 *
 * This plugin enables direct import of KiCad footprint files in tscircuit projects
 * when running with Bun. It parses the kicad_mod file at import time and exports
 * circuit JSON that can be used directly as a footprint.
 *
 * Usage:
 * 1. Via preload: bun --preload ./node_modules/tscircuit/plugins/preload.ts your-file.tsx
 * 2. Via bunfig.toml:
 *    [run]
 *    preload = ["./node_modules/tscircuit/plugins/preload.ts"]
 * 3. Manual registration:
 *    import { registerKicadModPlugin } from "tscircuit/plugins/bun-plugin-kicad-mod"
 *    registerKicadModPlugin() // Must be called before any .kicad_mod imports
 *
 * Then in your code:
 *   import footprint from "./my-footprint.kicad_mod"
 *   <chip footprint={footprint} name="U1" />
 */

import { parseKicadModToCircuitJson } from "kicad-component-converter"

export interface BunPluginBuilder {
  onLoad(
    options: { filter: RegExp },
    callback: (args: { path: string }) => Promise<{ contents: string; loader: string }>
  ): void
}

export interface BunPlugin {
  name: string
  setup: (build: BunPluginBuilder) => void
}

/**
 * The Bun plugin configuration for .kicad_mod files
 */
export const kicadModPlugin: BunPlugin = {
  name: "tscircuit-kicad-mod",
  setup(build) {
    build.onLoad({ filter: /\.kicad_mod$/ }, async (args) => {
      // Read the file content
      const content = await Bun.file(args.path).text()

      // Parse kicad_mod to circuit JSON at import time
      const circuitJson = await parseKicadModToCircuitJson(content)

      // Export the circuit JSON directly
      return {
        contents: `export default ${JSON.stringify(circuitJson)};`,
        loader: "js",
      }
    })
  },
}

let registered = false

/**
 * Register the KiCad footprint plugin with Bun.
 * This must be called before any .kicad_mod imports.
 *
 * Note: It's recommended to use the preload.ts file instead
 * to ensure the plugin is registered before any imports.
 */
export const registerKicadModPlugin = (): void => {
  if (registered) return
  registered = true

  if (typeof Bun !== "undefined" && typeof Bun.plugin === "function") {
    Bun.plugin(kicadModPlugin as any)
  }
}

// Re-export for convenience
export default kicadModPlugin
