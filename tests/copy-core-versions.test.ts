import { expect, test } from "bun:test"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("core sync preserves the independently updated glTF converter", async () => {
  const dir = await mkdtemp(join(tmpdir(), "copy-core-versions-"))
  try {
    await mkdir(join(dir, "scripts"), { recursive: true })
    await mkdir(join(dir, "node_modules/@tscircuit/core"), { recursive: true })
    await writeFile(
      join(dir, "scripts/copy-core-versions.ts"),
      await readFile(
        new URL("../scripts/copy-core-versions.ts", import.meta.url),
      ),
    )
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        dependencies: {
          "circuit-json-to-gltf": "^0.0.127",
          "circuit-json": "^0.0.488",
        },
      }),
    )
    await writeFile(
      join(dir, "node_modules/@tscircuit/core/package.json"),
      JSON.stringify({
        devDependencies: {
          "circuit-json-to-gltf": "^0.0.125",
          "circuit-json": "^0.0.489",
        },
      }),
    )
    const result = Bun.spawnSync(
      [process.execPath, "scripts/copy-core-versions.ts"],
      { cwd: dir },
    )
    expect(result.exitCode).toBe(0)
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"))
    expect(pkg.dependencies["circuit-json-to-gltf"]).toBe("^0.0.127")
    expect(pkg.dependencies["circuit-json"]).toBe("^0.0.489")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
