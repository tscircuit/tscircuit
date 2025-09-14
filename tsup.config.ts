import { defineConfig } from "tsup"
import { glob } from "glob"
import path from "path"

// Find all TypeScript and TypeScript JSX files in the src directory
const entryPoints = ["index.ts", ...glob.sync("src/**/*.{ts,tsx}")]

export default defineConfig({
  entry: entryPoints,
  format: ["esm"],
  dts: true,
  sourcemap: "inline",
  clean: true,
  outDir: "dist",
  splitting: true,
  bundle: true,
  skipNodeModulesBundle: true,
  target: "es2020",
  external: ["react"],
  tsconfig: "./tsconfig.json",
  minify: false,
  // Preserve directory structure
  outExtension: ({ format }) => ({
    js: ".js",
    dts: ".d.ts",
  }),
  // Ensure proper module resolution
  esbuildOptions(options) {
    options.resolveExtensions = [".tsx", ".ts", ".jsx", ".js", ".json"]
    options.jsx = "automatic"
  },
})
