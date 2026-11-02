import { expect, test } from "bun:test"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("core's bundled geometry tools do not block synchronization of shared runtime dependencies", async () => {
  const root = await mkdtemp(join(tmpdir(), "tscircuit-core-dependency-sync-"))
  try {
    await mkdir(join(root, "scripts"), { recursive: true })
    await mkdir(join(root, "node_modules/@tscircuit/core"), { recursive: true })
    await writeFile(
      join(root, "scripts/copy-core-versions.ts"),
      await readFile(
        new URL("../scripts/copy-core-versions.ts", import.meta.url),
      ),
    )
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        dependencies: {
          "circuit-json": "^0.0.532",
          "@tscircuit/manifold-2d": "^0.0.6",
        },
      }),
    )
    const coreManifest = {
      dependencies: { "circuit-json": "^0.0.534" },
      devDependencies: {
        "@tscircuit/manifold-2d": "^0.0.8",
        "@tscircuit/cad-collision-checking":
          "github:tscircuit/cad-collision-checking#8e08164",
        "jscad-to-manifold": "github:tscircuit/jscad-to-manifold#6db5a7b",
        "@tscircuit/graphics-debug-3d":
          "https://jscdn.tscircuit.com/@tscircuit/graphics-debug-3d/0.0.1.tgz",
        "@tscircuit/test-point-rerouter":
          "github:tscircuit/test-point-rerouter#b0ccfaca75a7e187c55ddb6f2071a1f2084e3167",
        "@tscircuit/jscad":
          "https://jscdn.tscircuit.com/@tscircuit/jscad/0.0.3.tgz",
        "@tscircuit/circuit-json-to-drawing":
          "https://jscdn.tscircuit.com/@tscircuit/circuit-json-to-drawing/0.0.3.tgz",
      },
    }
    const coreManifestPath = join(
      root,
      "node_modules/@tscircuit/core/package.json",
    )
    await writeFile(coreManifestPath, JSON.stringify(coreManifest))
    const run = () =>
      Bun.spawnSync([process.execPath, "scripts/copy-core-versions.ts"], {
        cwd: root,
      })
    expect(run().exitCode).toBe(0)
    const updated = JSON.parse(
      await readFile(join(root, "package.json"), "utf8"),
    )
    expect(updated.dependencies["circuit-json"]).toBe("^0.0.534")
    expect(
      updated.dependencies["@tscircuit/circuit-json-to-drawing"],
    ).toBeUndefined()
    expect(updated.dependencies["@tscircuit/jscad"]).toBeUndefined()
    expect(
      updated.dependencies["@tscircuit/test-point-rerouter"],
    ).toBeUndefined()
    expect(updated.dependencies["@tscircuit/manifold-2d"]).toBe("^0.0.8")
    expect(
      updated.dependencies["@tscircuit/cad-collision-checking"],
    ).toBeUndefined()
    expect(updated.dependencies["jscad-to-manifold"]).toBeUndefined()
    expect(updated.dependencies["@tscircuit/graphics-debug-3d"]).toBeUndefined()

    // Unknown runtime dependencies must still stop the updater.
    await writeFile(
      coreManifestPath,
      JSON.stringify({
        ...coreManifest,
        dependencies: {
          ...coreManifest.dependencies,
          "new-runtime-solver": "1.0.0",
        },
      }),
    )
    const missingRuntime = run()
    expect(missingRuntime.exitCode).not.toBe(0)
    expect(missingRuntime.stderr.toString()).toContain("new-runtime-solver")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
