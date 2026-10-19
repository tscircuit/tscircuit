import { expect, test } from "bun:test"
import { existsSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { generateLibonlyPackageJson } from "../scripts/create-libonly-package"

test("generateLibonlyPackageJson strips CLI dependency, bin, and adds -libonly suffix", () => {
  const mockPackage = {
    name: "tscircuit",
    version: "0.0.100",
    bin: { tsci: "cli.mjs" },
    files: ["dist", "cli.mjs", "globals.d.ts"],
    dependencies: {
      "@tscircuit/core": "1.0.0",
      "@tscircuit/cli": "2.0.0",
      "circuit-json": "3.0.0",
    },
  }

  const result = generateLibonlyPackageJson(mockPackage)

  expect(result.version).toBe("0.0.100-libonly")
  expect(result.bin).toBeUndefined()
  expect(result.files).not.toContain("cli.mjs")
  expect(result.files).toContain("dist")
  expect(result.files).toContain("globals.d.ts")
  expect(result.dependencies["@tscircuit/cli"]).toBeUndefined()
  expect(result.dependencies["@tscircuit/core"]).toBe("1.0.0")
  expect(result.dependencies["circuit-json"]).toBe("3.0.0")
})

test("scripts/create-libonly-package.js executes and creates package-libonly.json", () => {
  const projectRoot = join(import.meta.dirname, "..")
  const scriptPath = join(projectRoot, "scripts", "create-libonly-package.js")
  const outputPath = join(projectRoot, "package-libonly.json")

  const proc = Bun.spawnSync([process.execPath, "run", scriptPath], {
    cwd: projectRoot,
  })
  expect(proc.exitCode).toBe(0)
  expect(existsSync(outputPath)).toBe(true)

  // Clean up created file
  try {
    unlinkSync(outputPath)
  } catch {}
})
