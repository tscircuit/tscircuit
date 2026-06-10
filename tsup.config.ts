import { defineConfig } from "tsup"

export default defineConfig({
  entryPoints: ["index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: "inline",
  clean: true,
  external: ["react-reconciler", "react-reconciler-18"],
})