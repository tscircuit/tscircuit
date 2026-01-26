import type { BunPlugin } from "bun"
import { readFileSync } from "fs"
import { resolve } from "path"

export const kicadModPlugin: BunPlugin = {
  name: "kicad-mod-loader",
  setup(build) {
    build.onLoad({ filter: /\.kicad_mod$/ }, async (args) => {
      const absolutePath = resolve(args.path)
      const fileUrl = `file://${absolutePath}`

      return {
        contents: `export default ${JSON.stringify(fileUrl)};`,
        loader: "js",
      }
    })
  },
}

export function registerKicadModPlugin() {
  if (typeof Bun !== "undefined") {
    Bun.plugin(kicadModPlugin)
  }
}

export default kicadModPlugin
