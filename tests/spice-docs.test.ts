import { expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

test("spice simulation guide and introduction documentation exist and are linked", () => {
  const introPath = path.resolve(__dirname, "../docs/introduction.md")
  const spicePath = path.resolve(__dirname, "../docs/spice-simulation.md")

  expect(fs.existsSync(introPath)).toBe(true)
  expect(fs.existsSync(spicePath)).toBe(true)

  const intro = fs.readFileSync(introPath, "utf-8")
  const spice = fs.readFileSync(spicePath, "utf-8")

  expect(intro).toContain("./spice-simulation.md")
  expect(spice).toContain("circuit-json-to-spice")
  expect(spice).toContain("@tscircuit/ngspice-spice-engine")
  expect(spice).toContain("Transient Analysis")
})
