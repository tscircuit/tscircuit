import { test, expect } from "bun:test"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"

/**
 * Reproduce issue #2142: MST-segmented traces produce N*M overlap errors
 * for what is conceptually 1 net-pair overlap.
 *
 * Two nets each have 2 MST trace segments. The nets cross at the origin.
 * Expected: 1 conceptual overlap error (net A crosses net B).
 * Actual: up to 4 errors (each MST segment of A × each MST segment of B).
 */
test("MST trace segments should not multiply DRC overlap errors (#2142)", () => {
  const circuitJson: any[] = [
    // source traces
    { type: "source_trace", source_trace_id: "st_1", connected_source_port_ids: ["sp_1","sp_2"], connected_source_net_ids: ["net_a"] },
    { type: "source_trace", source_trace_id: "st_2", connected_source_port_ids: ["sp_3","sp_4"], connected_source_net_ids: ["net_b"] },

    // source ports / components
    { type: "source_port", source_port_id: "sp_1", source_component_id: "sc_1", name: "pin1" },
    { type: "source_port", source_port_id: "sp_2", source_component_id: "sc_2", name: "pin1" },
    { type: "source_port", source_port_id: "sp_3", source_component_id: "sc_3", name: "pin1" },
    { type: "source_port", source_port_id: "sp_4", source_component_id: "sc_4", name: "pin1" },
    { type: "source_component", source_component_id: "sc_1", name: "R1" },
    { type: "source_component", source_component_id: "sc_2", name: "R2" },
    { type: "source_component", source_component_id: "sc_3", name: "R3" },
    { type: "source_component", source_component_id: "sc_4", name: "R4" },

    // pcb ports
    { type: "pcb_port", pcb_port_id: "pp_1", source_port_id: "sp_1", pcb_component_id: "pc_1", x: -5, y: 0, layers: ["top"] },
    { type: "pcb_port", pcb_port_id: "pp_2", source_port_id: "sp_2", pcb_component_id: "pc_2", x: 5, y: 0, layers: ["top"] },
    { type: "pcb_port", pcb_port_id: "pp_3", source_port_id: "sp_3", pcb_component_id: "pc_3", x: 0, y: -5, layers: ["top"] },
    { type: "pcb_port", pcb_port_id: "pp_4", source_port_id: "sp_4", pcb_component_id: "pc_4", x: 0, y: 5, layers: ["top"] },

    // Net A: two MST segments (horizontal, crossing through origin)
    {
      type: "pcb_trace", pcb_trace_id: "st_1__mst0_0", source_trace_id: "st_1",
      route: [
        { route_type: "wire", x: -5, y: 0, width: 0.15, layer: "top" },
        { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
      ]
    },
    {
      type: "pcb_trace", pcb_trace_id: "st_1__mst1_0", source_trace_id: "st_1",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
        { route_type: "wire", x: 5, y: 0, width: 0.15, layer: "top" },
      ]
    },
    // Net B: two MST segments (vertical, crossing through origin)
    {
      type: "pcb_trace", pcb_trace_id: "st_2__mst0_0", source_trace_id: "st_2",
      route: [
        { route_type: "wire", x: 0, y: -5, width: 0.15, layer: "top" },
        { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
      ]
    },
    {
      type: "pcb_trace", pcb_trace_id: "st_2__mst1_0", source_trace_id: "st_2",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.15, layer: "top" },
        { route_type: "wire", x: 0, y: 5, width: 0.15, layer: "top" },
      ]
    },
  ]

  const errors = checkEachPcbTraceNonOverlapping(circuitJson)

  // Exactly 1 overlap should be detected (net A crosses net B),
  // not 4 (one per MST segment pair)
  expect(errors.length).toBe(1)
})
