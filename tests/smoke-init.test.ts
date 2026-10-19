import { expect, test } from "bun:test"
import { join } from "node:path"

test("smoke-init-test runs cleanly in isolated environment", () => {
  const projectRoot = join(import.meta.dirname, "..")
  const scriptPath = join(projectRoot, "scripts", "smoke-init-test.ts")

  const proc = Bun.spawnSync([process.execPath, "run", scriptPath], {
    cwd: projectRoot,
  })
  expect(proc.exitCode).toBe(0)
  expect(proc.stdout.toString()).toContain("Smoke test completed successfully")
}, 60_000)
