import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

test("package.json defines standard developer workflow scripts", async () => {
  const projectRoot = join(import.meta.dirname, "..")
  const pkgJsonPath = join(projectRoot, "package.json")
  const content = await readFile(pkgJsonPath, "utf-8")
  const pkg = JSON.parse(content)

  expect(pkg.scripts).toBeDefined()
  expect(pkg.scripts.test).toBe("bun test")
  expect(pkg.scripts.typecheck).toBe("tsc --noEmit")
  expect(pkg.scripts.lint).toBe("biome check .")
  expect(pkg.scripts.format).toBe("biome format . --write")
  expect(pkg.scripts["format:check"]).toBe("biome format .")
})
