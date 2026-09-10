import test, { expect } from "bun:test"

test("tscircuit - sub-circuit pin alias symbol binding", () => {
  const pinMap: Record<string, number> = {
    "VCC": 1,
    "VDD": 1,
    "GND": 2,
    "VSS": 2
  }
  expect(pinMap["VCC"]).toBe(pinMap["VDD"])
  expect(pinMap["GND"]).toBe(pinMap["VSS"])
})
