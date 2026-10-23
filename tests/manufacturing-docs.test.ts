import { expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

test("pcb manufacturing guide and introduction documentation exist and are linked", () => {
  const introPath = path.resolve(__dirname, "../docs/introduction.md")
  const mfgPath = path.resolve(
    __dirname,
    "../docs/pcb-manufacturing-and-export.md",
  )

  expect(fs.existsSync(introPath)).toBe(true)
  expect(fs.existsSync(mfgPath)).toBe(true)

  const intro = fs.readFileSync(introPath, "utf-8")
  const mfg = fs.readFileSync(mfgPath, "utf-8")

  expect(intro).toContain("./pcb-manufacturing-and-export.md")
  expect(mfg).toContain("Gerber")
  expect(mfg).toContain("Pick-and-Place")
  expect(mfg).toContain("tsci export")
})
