import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const projectRoot = join(import.meta.dirname, "..")
const cliPath = join(projectRoot, "cli.mjs")
const testDir = await mkdtemp(join(tmpdir(), "tscircuit-smoke-init-"))

try {
  // Test local CLI execution in isolated directory without polluting global npm
  const versionProc = Bun.spawnSync([process.execPath, cliPath, "--version"], {
    cwd: testDir,
  })
  if (versionProc.exitCode !== 0) {
    throw new Error(
      `CLI --version check failed: ${versionProc.stderr.toString()}`,
    )
  }

  const helpProc = Bun.spawnSync([process.execPath, cliPath, "--help"], {
    cwd: testDir,
  })
  if (helpProc.exitCode !== 0) {
    throw new Error(`CLI --help check failed: ${helpProc.stderr.toString()}`)
  }

  console.log(
    "Smoke test completed successfully in isolated directory:",
    testDir,
  )
} finally {
  await rm(testDir, { recursive: true, force: true })
}
