import { expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

test("custom components guide and introduction documentation are complete and linked", () => {
  const introPath = path.resolve(__dirname, "../docs/introduction.md")
  const guidePath = path.resolve(
    __dirname,
    "../docs/custom-components-and-props.md",
  )

  expect(fs.existsSync(introPath)).toBe(true)
  expect(fs.existsSync(guidePath)).toBe(true)

  const intro = fs.readFileSync(introPath, "utf-8")
  const guide = fs.readFileSync(guidePath, "utf-8")

  // Introduction links to the guide
  expect(intro).toContain("./custom-components-and-props.md")

  // Guide covers key component concepts
  expect(guide).toContain("pinLabels")
  expect(guide).toContain("supplierPartNumbers")
  expect(guide).toContain("<group")
  expect(guide).toContain("kicadFootprintStrings")
})
