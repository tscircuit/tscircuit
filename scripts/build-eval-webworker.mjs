import { build } from "esbuild"
import { join } from "node:path"
import { readFile } from "node:fs/promises"

const coreManifest = JSON.parse(await readFile(join(import.meta.dirname, "../node_modules/@tscircuit/core/package.json"), "utf8"))
const disabledBrowserDependencies = Object.entries(coreManifest.browser ?? {})
  .filter(([, replacement]) => replacement === false)
  .map(([packageName]) => packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
const result = await build({
  entryPoints: [join(import.meta.dirname, "../webworker/entrypoint.ts")],
  outfile: join(import.meta.dirname, "../dist/webworker.min.js"),
  bundle: true,
  platform: "browser",
  format: "esm",
  minify: true,
  loader: { ".wasm": "dataurl" },
  // Preserve guarded Node-only export paths without bundling native addons into
  // a browser worker. The browser implementations do not load these modules.
  external: ["node:*", "fs", "os", "path"],
  metafile: true,
  plugins: [{
    name: "core-browser-dependencies",
    setup(buildContext) {
      // Honor Core's declared browser:false policy for native-only dependencies
      // even when another bundled dependency imports the same native addon.
      buildContext.onResolve({ filter: new RegExp(`^(?:${disabledBrowserDependencies.join("|") || "(?!)"})$`) }, (args) => ({
        path: args.path,
        namespace: "core-browser-disabled",
      }))
      buildContext.onLoad({ filter: /.*/, namespace: "core-browser-disabled" }, () => ({
        contents: "module.exports = {}",
        loader: "js",
      }))
    },
  }],
})

const staticExternalImports = Object.values(result.metafile.outputs)
  .flatMap((output) => output.imports)
  .filter((entry) => entry.external && entry.kind === "import-statement")
if (staticExternalImports.length)
  throw new Error(`Browser worker contains unresolved static imports: ${staticExternalImports.map((entry) => entry.path).join(", ")}`)
