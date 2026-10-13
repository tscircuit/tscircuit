import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import packageJson from "../package.json"

test("published package does not depend on manifold-3d", async () => {
  const manifest = packageJson as unknown as {
    dependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    bundleDependencies?: string[]
    bundledDependencies?: string[]
  }

  expect(manifest.dependencies?.["manifold-3d"]).toBeUndefined()
  expect(manifest.optionalDependencies?.["manifold-3d"]).toBeUndefined()
  expect(manifest.peerDependencies?.["manifold-3d"]).toBeUndefined()
  expect(manifest.bundleDependencies ?? []).not.toContain("manifold-3d")
  expect(manifest.bundledDependencies ?? []).not.toContain("manifold-3d")

  const auditDir = await mkdtemp(join(tmpdir(), "tscircuit-dependency-audit-"))
  const packDir = join(auditDir, "pack")
  const installDir = join(auditDir, "install")

  try {
    await mkdir(packDir)
    await mkdir(installDir)

    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm"
    const repoRoot = fileURLToPath(new URL("..", import.meta.url))
    const npmEnv = {
      ...process.env,
      npm_config_cache: join(auditDir, "npm-cache"),
    }
    const pack = spawnSync(npmCmd, ["pack", "--pack-destination", packDir], {
      cwd: repoRoot,
      env: npmEnv,
      shell: process.platform === "win32",
    })
    expect(pack.status, pack.stderr?.toString()).toBe(0)

    const [tarballName] = await readdir(packDir)
    expect(tarballName).toEndWith(".tgz")

    await Bun.write(
      join(installDir, "package.json"),
      JSON.stringify({ private: true }),
    )
    const install = spawnSync(
      npmCmd,
      [
        "install",
        "--package-lock-only",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        join(packDir, tarballName),
      ],
      { cwd: installDir, env: npmEnv, shell: process.platform === "win32" },
    )
    expect(install.status, install.stderr?.toString()).toBe(0)

    const lockfile = await Bun.file(
      join(installDir, "package-lock.json"),
    ).text()
    expect(lockfile).not.toContain('"node_modules/manifold-3d"')
    expect(
      await Bun.file(
        join(installDir, "node_modules/manifold-3d/package.json"),
      ).exists(),
    ).toBe(false)
  } finally {
    await rm(auditDir, { recursive: true, force: true })
  }
}, 120_000)
