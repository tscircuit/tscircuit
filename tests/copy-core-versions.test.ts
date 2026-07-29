import { expect, test } from "bun:test"
import {
  applyCoreVersionUpdates,
  legacyRegexUpdatePackageJson,
} from "../scripts/copy-core-versions"

test("JSON updater rewrites awkwardly spaced dependency entries", () => {
  const packageJsonText = `{
  "dependencies": {
    "zod" : "^3.0.0",
    "@tscircuit/math-utils": "^0.0.1"
  },
  "devDependencies": {}
}
`

  const currentPackageJson = JSON.parse(packageJsonText) as {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }

  const corePackageJson = {
    dependencies: {
      zod: "^3.25.67",
      "@tscircuit/math-utils": "^0.0.36",
    },
    devDependencies: {},
  }

  const { updates, missingDeps, currentPackageJson: updated } =
    applyCoreVersionUpdates(currentPackageJson, corePackageJson)

  expect(missingDeps).toEqual([])
  expect(updates).toHaveLength(2)
  expect(updated.dependencies?.zod).toBe("^3.25.67")
  expect(updated.dependencies?.["@tscircuit/math-utils"]).toBe("^0.0.36")

  // Prove the previous regex rewriter silently missed spaced keys.
  const legacy = legacyRegexUpdatePackageJson(
    packageJsonText,
    {
      zod: "^3.25.67",
      "@tscircuit/math-utils": "^0.0.36",
    },
    {
      zod: "^3.0.0",
      "@tscircuit/math-utils": "^0.0.1",
    },
  )
  expect(legacy.includes('"zod" : "^3.0.0"')).toBe(true)
  expect(legacy.includes('"@tscircuit/math-utils": "^0.0.36"')).toBe(true)
})

test("copy-core-versions script exits cleanly against this package.json", async () => {
  const result = Bun.spawnSync(["bun", "run", "scripts/copy-core-versions.ts"], {
    cwd: new URL("..", import.meta.url).pathname,
    stdout: "pipe",
    stderr: "pipe",
  })
  expect(result.exitCode, result.stderr.toString()).toBe(0)
})
