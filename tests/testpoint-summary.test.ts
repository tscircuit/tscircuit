import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestPointSummary } from "../src/testpoint-summary"

test("getTestPointSummary correctly identifies test points, coordinates, and nets", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "src_tp1",
      name: "TP1",
      ftype: "simple_test_point",
    } as any,
    {
      type: "source_component",
      source_component_id: "src_tp2",
      name: "TP_GND",
      ftype: "simple_test_point",
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pcb_tp1",
      source_component_id: "src_tp1",
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pcb_tp2",
      source_component_id: "src_tp2",
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_tp1",
      pcb_component_id: "pcb_tp1",
      layer: "top",
      shape: "circle",
      radius: 0.75,
      x: 10,
      y: 12,
      source_net_id: "net_VCC",
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_tp2",
      pcb_component_id: "pcb_tp2",
      layer: "bottom",
      shape: "circle",
      radius: 0.75,
      x: -5,
      y: 8,
      source_net_id: "net_GND",
    } as any,
  ]

  const summary = getTestPointSummary(elements)

  expect(summary.totalTestPoints).toBe(2)
  expect(summary.topLayerCount).toBe(1)
  expect(summary.bottomLayerCount).toBe(1)
  expect(summary.coveredNets).toEqual(["net_GND", "net_VCC"])

  const tp1 = summary.testPoints.find((tp) => tp.name === "TP1")
  expect(tp1).toBeDefined()
  expect(tp1!.x).toBe(10)
  expect(tp1!.y).toBe(12)
  expect(tp1!.layer).toBe("top")
  expect(tp1!.netId).toBe("net_VCC")
  expect(tp1!.padDimensions.diameter).toBe(1.5)
})
