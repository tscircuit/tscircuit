import { expect, test } from "bun:test"
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import packageJson from "../package.json"

const forbiddenPackages = [
  "manifold-3d",
  "circuit-json-to-bpc",
  "circuit-json-to-connectivity-map",
  "circuit-json-to-gltf",
  "circuit-json-to-pnp-csv",
  "circuit-json-to-simple-3d",
  "circuit-json-to-spice",
  "circuit-to-svg",
]

test("published package does not depend on bundled converters", async () => {
  const manifest = packageJson as unknown as {
    dependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    bundleDependencies?: string[]
    bundledDependencies?: string[]
  }

  for (const packageName of forbiddenPackages) {
    expect(manifest.dependencies?.[packageName]).toBeUndefined()
    expect(manifest.optionalDependencies?.[packageName]).toBeUndefined()
    expect(manifest.peerDependencies?.[packageName]).toBeUndefined()
    expect(manifest.bundleDependencies ?? []).not.toContain(packageName)
    expect(manifest.bundledDependencies ?? []).not.toContain(packageName)
  }

  const auditDir = await mkdtemp(join(tmpdir(), "tscircuit-dependency-audit-"))
  const packDir = join(auditDir, "pack")
  const installDir = join(auditDir, "install")

  try {
    await mkdir(packDir)
    await mkdir(installDir)

    const npmEnv = {
      ...process.env,
      npm_config_cache: join(auditDir, "npm-cache"),
    }
    const pack = Bun.spawnSync(["npm", "pack", "--pack-destination", packDir], {
      cwd: new URL("..", import.meta.url).pathname,
      env: npmEnv,
    })
    expect(pack.exitCode, pack.stderr.toString()).toBe(0)

    const [tarballName] = await readdir(packDir)
    expect(tarballName).toEndWith(".tgz")

    await Bun.write(
      join(installDir, "package.json"),
      JSON.stringify({ private: true }),
    )
    const install = Bun.spawnSync(
      [
        "npm",
        "install",
        "--ignore-scripts",
        "--legacy-peer-deps",
        "--no-audit",
        "--no-fund",
        join(packDir, tarballName),
      ],
      { cwd: installDir, env: npmEnv },
    )
    expect(install.exitCode, install.stderr.toString()).toBe(0)

    const lockfile = await Bun.file(
      join(installDir, "package-lock.json"),
    ).text()
    for (const packageName of forbiddenPackages) {
      expect(lockfile).not.toContain(`"node_modules/${packageName}"`)
      expect(
        await Bun.file(
          join(installDir, `node_modules/${packageName}/package.json`),
        ).exists(),
      ).toBe(false)
    }
  } finally {
    await rm(auditDir, { recursive: true, force: true })
  }
}, 60_000)
