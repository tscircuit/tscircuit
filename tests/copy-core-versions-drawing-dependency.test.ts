import { expect, test } from "bun:test"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("core's bundled and CLI-only tools do not block synchronization of shared runtime dependencies", async () => {
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
          "circuit-json-to-pnp-csv": "^0.0.19",
        },
      }),
    )
    const coreManifest = {
      dependencies: { "circuit-json": "^0.0.534" },
      devDependencies: {
        "@tscircuit/manifold-2d": "^0.0.8",
        "@tscircuit/cad-collision-checking":
          "https://jscdn.tscircuit.com/@tscircuit/cad-collision-checking/0.0.6.tgz",
        "@tscircuit/jscad-to-manifold":
          "https://jscdn.tscircuit.com/@tscircuit/jscad-to-manifold/0.0.1.tgz",
        "@tscircuit/graphics-debug-3d":
          "https://jscdn.tscircuit.com/@tscircuit/graphics-debug-3d/0.0.1.tgz",
        "@tscircuit/test-point-rerouter":
          "github:tscircuit/test-point-rerouter#b0ccfaca75a7e187c55ddb6f2071a1f2084e3167",
        "@tscircuit/jscad":
          "https://jscdn.tscircuit.com/@tscircuit/jscad/0.0.3.tgz",
        "@tscircuit/circuit-json-to-drawing":
          "https://jscdn.tscircuit.com/@tscircuit/circuit-json-to-drawing/0.0.3.tgz",
        // CLI converter version declarations introduced in core 0.0.2279.
        "circuit-json-to-3d-png": "^0.0.6",
        "circuit-json-to-altium":
          "github:tscircuit/circuit-json-to-altium#1a50d0dd2c0737cf940d92c0315852dc0111dd87",
        "circuit-json-to-fdm-component-box": "^0.0.2",
        "circuit-json-to-footprinter": "^0.0.59",
        "circuit-json-to-gerber": "^0.0.120",
        "circuit-json-to-kicad": "0.0.267",
        "circuit-json-to-readable-netlist": "^0.0.15",
        "circuit-json-to-step": "^0.0.63",
        "circuit-json-to-tscircuit": "^0.0.50",
        "dsn-converter": "^0.0.90",
        "easyeda": "^0.0.389",
        "circuit-json-to-pnp-csv": "^0.0.20",
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
    expect(updated.dependencies).toEqual({
      "circuit-json": "^0.0.534",
      "@tscircuit/manifold-2d": "^0.0.8",
      "circuit-json-to-pnp-csv": "^0.0.20",
    })

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
