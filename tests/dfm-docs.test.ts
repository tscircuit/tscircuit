import { expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

test("docs: drc-and-dfm-guide.md exists and covers critical DFM rules", () => {
  const filePath = join(process.cwd(), "docs", "drc-and-dfm-guide.md")
  expect(existsSync(filePath)).toBe(true)

  const content = readFileSync(filePath, "utf-8")
  expect(content.length).toBeGreaterThan(500)
  expect(content).toContain("Min Trace Width")
  expect(content).toContain("Min Trace Clearance")
  expect(content).toContain("Annular Ring")
  expect(content).toContain("Solder Mask Web")
  expect(content).toContain("Pre-Flight Fabrication Checklist")
})
