import { expect, test } from "bun:test"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("core's bundled drawing kernel and snapshot exporter do not block dependency synchronization", async () => {
  const root = await mkdtemp(join(tmpdir(), "tscircuit-core-dependency-sync-"))
  try {
    await mkdir(join(root, "scripts"), { recursive: true })
    await mkdir(join(root, "node_modules/@tscircuit/core"), { recursive: true })
    await writeFile(
      join(root, "scripts/copy-core-versions.ts"),
      await readFile(new URL("../scripts/copy-core-versions.ts", import.meta.url)),
    )
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { "circuit-json": "^0.0.532" } }),
    )
    const coreManifest = {
      dependencies: { "circuit-json": "^0.0.534" },
      devDependencies: {
        "@tscircuit/test-point-rerouter":
          "github:tscircuit/test-point-rerouter#b0ccfaca75a7e187c55ddb6f2071a1f2084e3167",
        "@tscircuit/jscad": "https://jscdn.tscircuit.com/@tscircuit/jscad/0.0.3.tgz",
        "@tscircuit/circuit-json-to-drawing":
          "https://jscdn.tscircuit.com/@tscircuit/circuit-json-to-drawing/0.0.3.tgz",
      },
    }
    const coreManifestPath = join(root, "node_modules/@tscircuit/core/package.json")
    await writeFile(coreManifestPath, JSON.stringify(coreManifest))
    const run = () =>
      Bun.spawnSync([process.execPath, "scripts/copy-core-versions.ts"], {
        cwd: root,
      })
    expect(run().exitCode).toBe(0)
    const updated = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
    expect(updated.dependencies["circuit-json"]).toBe("^0.0.534")
    expect(updated.dependencies["@tscircuit/circuit-json-to-drawing"]).toBeUndefined()
    expect(updated.dependencies["@tscircuit/jscad"]).toBeUndefined()
    expect(updated.dependencies["@tscircuit/test-point-rerouter"]).toBeUndefined()

    // Unknown runtime dependencies must still stop the updater.
    await writeFile(
      coreManifestPath,
      JSON.stringify({
        ...coreManifest,
        dependencies: { ...coreManifest.dependencies, "new-runtime-solver": "1.0.0" },
      }),
    )
    const missingRuntime = run()
    expect(missingRuntime.exitCode).not.toBe(0)
    expect(missingRuntime.stderr.toString()).toContain("new-runtime-solver")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
