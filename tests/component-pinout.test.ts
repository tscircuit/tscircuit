import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getComponentPinout } from "../index"

test("getComponentPinout resolves pins, nets, and ports by component name", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "sc_u1",
      name: "U1",
      supplier_part_numbers: { jlcpcb: ["C2040"] },
    },
    {
      type: "source_port",
      source_port_id: "sp_u1_1",
      source_component_id: "sc_u1",
      name: "VCC",
      pin_number: 1,
    },
    {
      type: "source_port",
      source_port_id: "sp_u1_2",
      source_component_id: "sc_u1",
      name: "GND",
      pin_number: 2,
    },
    {
      type: "source_port",
      source_port_id: "sp_u1_3",
      source_component_id: "sc_u1",
      name: "GPIO1",
      pin_number: 3,
    },
    {
      type: "source_net",
      source_net_id: "sn_vcc",
      name: "VCC_3V3",
    },
    {
      type: "source_net",
      source_net_id: "sn_gnd",
      name: "GND",
    },
    {
      type: "source_trace",
      source_trace_id: "st_1",
      connected_source_port_ids: ["sp_u1_1"],
      connected_source_net_ids: ["sn_vcc"],
    },
    {
      type: "source_trace",
      source_trace_id: "st_2",
      connected_source_port_ids: ["sp_u1_2"],
      connected_source_net_ids: ["sn_gnd"],
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_c_u1",
      source_component_id: "sc_u1",
      layer: "top",
      center: { x: 0, y: 0 },
      width: 5,
      height: 5,
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_u1_1",
      source_port_id: "sp_u1_1",
      pcb_component_id: "pcb_c_u1",
      x: -2,
      y: 0,
      layers: ["top"],
    },
    {
      type: "schematic_port",
      schematic_port_id: "sch_port_u1_1",
      source_port_id: "sp_u1_1",
      schematic_component_id: "sch_c_u1",
      center: { x: -5, y: 0 },
      facing_direction: "left",
    },
  ]

  // Query by name
  const pinout = getComponentPinout(circuitJson, "U1")
  expect(pinout).not.toBeNull()
  expect(pinout?.componentName).toBe("U1")
  expect(pinout?.componentId).toBe("sc_u1")
  expect(pinout?.supplierPartNumbers?.jlcpcb).toEqual(["C2040"])
  expect(pinout?.pins.length).toBe(3)

  // Pin 1 (VCC)
  const pin1 = pinout?.pins[0]
  expect(pin1?.pinNumber).toBe(1)
  expect(pin1?.portName).toBe("VCC")
  expect(pin1?.connectedNetName).toBe("VCC_3V3")
  expect(pin1?.connectedNetId).toBe("sn_vcc")
  expect(pin1?.connectedTracesCount).toBe(1)
  expect(pin1?.pcbPortId).toBe("pcb_port_u1_1")
  expect(pin1?.schematicPortId).toBe("sch_port_u1_1")

  // Pin 2 (GND)
  const pin2 = pinout?.pins[1]
  expect(pin2?.pinNumber).toBe(2)
  expect(pin2?.portName).toBe("GND")
  expect(pin2?.connectedNetName).toBe("GND")
  expect(pin2?.connectedNetId).toBe("sn_gnd")

  // Pin 3 (GPIO1 - unconnected)
  const pin3 = pinout?.pins[2]
  expect(pin3?.pinNumber).toBe(3)
  expect(pin3?.connectedNetName).toBeUndefined()
  expect(pin3?.connectedTracesCount).toBe(0)

  // Query by PCB component ID
  const pinoutByPcb = getComponentPinout(circuitJson, "pcb_c_u1")
  expect(pinoutByPcb?.componentName).toBe("U1")

  // Query non-existent component
  expect(getComponentPinout(circuitJson, "NON_EXISTENT")).toBeNull()
})
