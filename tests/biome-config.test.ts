import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

test("biome.json configuration schema validity", async () => {
  const projectRoot = join(import.meta.dirname, "..")
  const biomeContent = await readFile(join(projectRoot, "biome.json"), "utf-8")
  const config = JSON.parse(biomeContent)

  expect(config.$schema).toContain("biomejs.dev/schemas")
  expect(config.javascript?.formatter).toBeDefined()
  expect(config.javascript.formatter.trailingComma).toBe("all")
  expect((config.javascript.formatter as Record<string, unknown>).trailingCommas).toBeUndefined()
  expect(config.formatter?.indentStyle).toBe("space")
  expect(config.linter?.enabled).toBe(true)
})
