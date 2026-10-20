import { expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

test("docs: high-speed-and-rf-design.md exists and covers critical RF concepts", () => {
  const filePath = join(process.cwd(), "docs", "high-speed-and-rf-design.md")
  expect(existsSync(filePath)).toBe(true)

  const content = readFileSync(filePath, "utf-8")
  expect(content.length).toBeGreaterThan(500)
  expect(content).toContain("Controlled Impedance")
  expect(content).toContain("Microstrip")
  expect(content).toContain("Differential Pair")
  expect(content).toContain("Decoupling")
  expect(content).toContain("Via Stitching")
})
