import { defineConfig } from "tsup"

export default defineConfig({
  entryPoints: ["index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
})
