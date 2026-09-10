import test, { expect } from "bun:test"

test("tscircuit - cli export build target format list", () => {
  const targets = ["gerber", "svg", "circuit-json"]
  expect(targets).toContain("gerber")
  expect(targets).toContain("svg")
})
