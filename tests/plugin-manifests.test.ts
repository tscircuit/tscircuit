import { expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dir, "..")
const readJson = (path: string) =>
  JSON.parse(readFileSync(join(root, path), "utf8"))

test("agent marketplaces list the tscircuit plugin", () => {
  const codexPlugin = readJson(".codex-plugin/plugin.json")
  expect(readJson(".claude-plugin/plugin.json").name).toBe(codexPlugin.name)

  for (const path of [
    ".agents/plugins/marketplace.json",
    ".claude-plugin/marketplace.json",
  ]) {
    const names = readJson(path).plugins.map((p: { name: string }) => p.name)
    expect(names).toContain(codexPlugin.name)
  }
})

test("codex plugin paths exist", () => {
  const { skills, interface: ui } = readJson(".codex-plugin/plugin.json")
  for (const path of [skills, ui.logo]) {
    expect(path.startsWith("./")).toBe(true)
    expect(existsSync(join(root, path))).toBe(true)
  }
  expect(existsSync(join(root, skills, "tscircuit/SKILL.md"))).toBe(true)
})
