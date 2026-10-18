import { expect, test } from "bun:test"
import { join } from "node:path"
import packageJson from "../package.json"

test("cli.mjs returns package version with --version and -v", () => {
  const projectRoot = join(import.meta.dirname, "..")
  const cliScript = join(projectRoot, "cli.mjs")

  const procLong = Bun.spawnSync([process.execPath, cliScript, "--version"], {
    cwd: projectRoot,
  })
  expect(procLong.exitCode).toBe(0)
  expect(procLong.stdout.toString().trim()).toBe(packageJson.version)

  const procShort = Bun.spawnSync([process.execPath, cliScript, "-v"], {
    cwd: projectRoot,
  })
  expect(procShort.exitCode).toBe(0)
  expect(procShort.stdout.toString().trim()).toBe(packageJson.version)
})
