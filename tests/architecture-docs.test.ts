import { expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

test("architecture and introduction documentation are complete and interconnected", () => {
  const introPath = path.resolve(__dirname, "../docs/introduction.md")
  const archPath = path.resolve(__dirname, "../docs/architecture.md")

  expect(fs.existsSync(introPath)).toBe(true)
  expect(fs.existsSync(archPath)).toBe(true)

  const intro = fs.readFileSync(introPath, "utf-8")
  const arch = fs.readFileSync(archPath, "utf-8")

  // Introduction links to architecture
  expect(intro).toContain("./architecture.md")

  // Architecture covers key pipeline phases
  expect(arch).toContain("@tscircuit/core")
  expect(arch).toContain("@tscircuit/footprinter")
  expect(arch).toContain("@tscircuit/capacity-autorouter")
  expect(arch).toContain("@tscircuit/copper-pour-solver")
  expect(arch).toContain("circuit-json")
  expect(arch).toContain("circuit-to-svg")
})
