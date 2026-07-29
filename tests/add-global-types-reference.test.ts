import { expect, test } from "bun:test"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"

const root = join(import.meta.dirname, "..")
const referenceLine = '/// <reference path="../globals.d.ts" />'

test("add-global-types-reference prepends once and syncs static-assets.d.ts", async () => {
  const distDir = join(root, "dist")
  await mkdir(distDir, { recursive: true })
  await writeFile(join(distDir, "index.d.ts"), "export * from '@tscircuit/core'\n")

  const first = await $`bun run scripts/add-global-types-reference.ts`.cwd(root)
  expect(first.exitCode).toBe(0)

  const afterFirst = await readFile(join(distDir, "index.d.ts"), "utf-8")
  expect(afterFirst.startsWith(`${referenceLine}\n`)).toBe(true)
  expect(afterFirst.split(referenceLine).length - 1).toBe(1)

  const second = await $`bun run scripts/add-global-types-reference.ts`.cwd(root)
  expect(second.exitCode).toBe(0)
  const afterSecond = await readFile(join(distDir, "index.d.ts"), "utf-8")
  expect(afterSecond.split(referenceLine).length - 1).toBe(1)

  const globals = await readFile(join(root, "globals.d.ts"), "utf-8")
  const staticAssets = await readFile(join(distDir, "static-assets.d.ts"), "utf-8")
  expect(staticAssets).toBe(globals)
}, 30_000)

test("cli wrapper reports a clear error when @tscircuit/cli cannot load", async () => {
  const tmp = join(root, ".tmp-cli-error-test")
  await rm(tmp, { recursive: true, force: true })
  await mkdir(tmp, { recursive: true })

  await writeFile(
    join(tmp, "cli.mjs"),
    `#!/usr/bin/env bun
try {
  await import("./missing-cli-module.js")
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error("[tscircuit] Failed to start CLI:\\n" + message)
  process.exitCode = 1
}
`,
  )

  const result = Bun.spawnSync(["bun", "cli.mjs"], {
    cwd: tmp,
    stdout: "pipe",
    stderr: "pipe",
  })
  expect(result.exitCode).toBe(1)
  expect(result.stderr.toString()).toContain("[tscircuit] Failed to start CLI:")

  await rm(tmp, { recursive: true, force: true })
})
