/**
 * Bun plugin for loading .kicad_mod files
 *
 * This plugin enables direct import of KiCad footprint files in tscircuit projects
 * when running with Bun. It exports a file:// URL that can be fetched by the
 * footprintFileParserMap to parse the kicad_mod content.
 *
 * Usage:
 * 1. Via preload: bun --preload ./node_modules/tscircuit/plugins/preload.ts your-file.tsx
 * 2. Via bunfig.toml:
 *    [run]
 *    preload = ["./node_modules/tscircuit/plugins/preload.ts"]
 * 3. Manual registration:
 *    import { registerKicadModPlugin } from "tscircuit/plugins/bun-plugin-kicad-mod"
 *    registerKicadModPlugin() // Must be called before any .kicad_mod imports
 */

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
      // Export the file path as a file:// URL that Bun's fetch can handle
      const fileUrl = `file://${args.path}`
      return {
        contents: `export default ${JSON.stringify(fileUrl)};`,
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
