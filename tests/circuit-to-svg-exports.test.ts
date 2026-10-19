import { expect, test } from "bun:test"
import {
  circuitJsonToPcbSvg,
  circuitJsonToSchematicSvg,
  convertCircuitJsonToAssemblySvg,
  convertCircuitJsonToPcbSvg,
  convertCircuitJsonToSchematicSvg,
} from "../index"
import type { CircuitJson } from "circuit-json"

test("re-exported circuit-to-svg functions convert circuit json to SVG strings", async () => {
  const minimalCircuit: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board_1",
      width: 20,
      height: 20,
      center: { x: 0, y: 0 },
    },
  ]

  expect(typeof circuitJsonToPcbSvg).toBe("function")
  expect(typeof circuitJsonToSchematicSvg).toBe("function")
  expect(typeof convertCircuitJsonToPcbSvg).toBe("function")
  expect(typeof convertCircuitJsonToSchematicSvg).toBe("function")
  expect(typeof convertCircuitJsonToAssemblySvg).toBe("function")

  const pcbSvg = await circuitJsonToPcbSvg(minimalCircuit)
  expect(typeof pcbSvg).toBe("string")
  expect(pcbSvg).toContain("<svg")

  const schematicSvg = await circuitJsonToSchematicSvg(minimalCircuit)
  expect(typeof schematicSvg).toBe("string")
  expect(schematicSvg).toContain("<svg")
})
