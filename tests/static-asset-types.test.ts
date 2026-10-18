/// <reference path="../globals.d.ts" />
import { expect, test } from "bun:test"

test("static asset declaration types resolve", () => {
  type StpModule = typeof import("./fixtures/sample.stp")
  type DxfModule = typeof import("./fixtures/sample.dxf")
  type KicadSchModule = typeof import("./fixtures/sample.kicad_sch")
  type CircuitJsonModule = typeof import("./fixtures/sample.circuit.json")

  const stpMock: StpModule = { default: "path/to/sample.stp" }
  const dxfMock: DxfModule = { default: "path/to/sample.dxf" }

  expect(typeof stpMock.default).toBe("string")
  expect(typeof dxfMock.default).toBe("string")

  const circuitJsonMock: CircuitJsonModule = {
    default: [],
  }
  expect(Array.isArray(circuitJsonMock.default)).toBe(true)

  const kicadSchMock: KicadSchModule = {
    circuitJson: [],
    default: [],
  }
  expect(Array.isArray(kicadSchMock.circuitJson)).toBe(true)
})
