import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

for (const { runtime, moduleType } of [
  { runtime: "node", moduleType: "module" },
  { runtime: "node", moduleType: "commonjs" },
  { runtime: "bun", moduleType: "module" },
]) {
  test.skipIf(process.platform === "win32")(
    `tsci builds a ${moduleType} TSX project with ${runtime} on PATH`,
    async () => {
      const node = Bun.which("node")
      if (!node) throw new Error("Node must be installed for this test")

      const project = await mkdtemp(join(tmpdir(), "tscircuit-cli-runtime-"))
      try {
        const bin = join(project, "bin")
        await mkdir(bin)
        await symlink(node, join(bin, "node"))
        if (runtime === "bun") await symlink(process.execPath, join(bin, "bun"))
        await symlink(
          fileURLToPath(new URL("../cli.mjs", import.meta.url)),
          join(bin, "tsci"),
        )
        await symlink(
          fileURLToPath(new URL("../node_modules", import.meta.url)),
          join(project, "node_modules"),
        )
        await writeFile(
          join(project, "package.json"),
          JSON.stringify({ type: moduleType }),
        )
        await writeFile(
          join(project, "index.circuit.tsx"),
          `import React from "react"
if ((process.versions.bun ? "bun" : "node") !== ${JSON.stringify(runtime)}) {
  throw new Error("Unexpected CLI runtime")
}
export default () => <board width="10mm" height="10mm" />
`,
        )

        const result = spawnSync(
          join(bin, "tsci"),
          ["build", "index.circuit.tsx"],
          {
            cwd: project,
            env: { ...process.env, PATH: bin },
            encoding: "utf8",
            timeout: 30_000,
          },
        )
        if (result.error) throw result.error
        if (result.status !== 0) {
          throw new Error(
            `tsci exited with ${result.status}\n${result.stdout}\n${result.stderr}`,
          )
        }
        const circuit = JSON.parse(
          await readFile(join(project, "dist/index/circuit.json"), "utf8"),
        )
        expect(circuit).toContainEqual(
          expect.objectContaining({ type: "pcb_board" }),
        )
      } finally {
        await rm(project, { recursive: true, force: true })
      }
    },
    40_000,
  )
}
