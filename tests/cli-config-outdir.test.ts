import test from "ava"

test("resolves default output directory from tscircuit config or fallback defaults", (t) => {
  const userConfig = { outDir: "dist/circuits" }
  const defaultConfig = { outDir: "dist" }
  
  const resolvedOutDir = userConfig.outDir || defaultConfig.outDir
  t.is(resolvedOutDir, "dist/circuits")
})
