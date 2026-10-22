import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getCadModelSummary } from "../index"

test("getCadModelSummary detects 3D formats and extracts placement coordinates", () => {
  const circuitJson: CircuitJson = [
    {
      type: "cad_component",
      cad_component_id: "cad1",
      source_component_id: "sc1",
      model_url: "https://tscircuit.com/models/soic8.step",
      position: { x: 0, y: 0, z: 1.5 },
      rotation: { x: 0, y: 0, z: 90 },
    } as any,
    {
      type: "cad_component",
      cad_component_id: "cad2",
      source_component_id: "sc2",
      model_url: "https://tscircuit.com/models/resistor.glb",
      position: { x: 5, y: 5, z: 0.5 },
      rotation: { x: 0, y: 0, z: 0 },
    } as any,
  ]

  const summary = getCadModelSummary(circuitJson)

  expect(summary.totalCadModels).toBe(2)
  expect(summary.modelsByFormat.step).toBe(1)
  expect(summary.modelsByFormat.gltf).toBe(1)

  const m1 = summary.models.find((m) => m.cadComponentId === "cad1")
  expect(m1?.format).toBe("step")
  expect(m1?.position?.z).toBe(1.5)
})
