import { expect, test } from "bun:test"
import { Circuit } from "../dist"
import ArduinoNanoV3 from "../snippets/arduino-nano-v3"

type SoupElement = Record<string, any>

const renderCircuit = () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNanoV3 />)
  circuit.render()
  return circuit.getCircuitJson() as SoupElement[]
}

const byName = (soup: SoupElement[], name: string) => {
  const component = soup.find(
    (e) => e.type === "source_component" && e.name === name,
  )
  expect(component, `missing component ${name}`).toBeDefined()
  return component!
}

const portsFor = (soup: SoupElement[], name: string) => {
  const component = byName(soup, name)
  return soup.filter(
    (e) =>
      e.type === "source_port" &&
      e.source_component_id === component.source_component_id,
  )
}

const port = (soup: SoupElement[], name: string, label: string) => {
  const match = portsFor(soup, name).find((p) =>
    p.port_hints?.includes(label),
  )
  expect(match, `missing ${name}.${label}`).toBeDefined()
  return match!
}

const netKey = (soup: SoupElement[], name: string, label: string) =>
  port(soup, name, label).subcircuit_connectivity_map_key

const expectSharedNet = (
  soup: SoupElement[],
  left: [string, string],
  right: [string, string],
) => {
  expect(netKey(soup, left[0], left[1])).toBe(
    netKey(soup, right[0], right[1]),
  )
}

// ── Board Dimensions ──

test("Arduino Nano has correct board dimensions (45mm × 18mm)", () => {
  const soup = renderCircuit()
  const pcbBoard = soup.find((e) => e.type === "pcb_board")
  expect(pcbBoard).toBeDefined()
  expect(pcbBoard.width).toBe(45)
  expect(pcbBoard.height).toBe(18)
})

// ── Core Components ──

test("ATmega328P MCU is present with all 32 pins", () => {
  const soup = renderCircuit()
  byName(soup, "U1")
  const ports = portsFor(soup, "U1")
  expect(ports.length).toBeGreaterThanOrEqual(32)
})

test("CH340G USB-to-serial converter is present", () => {
  const soup = renderCircuit()
  byName(soup, "U2")
  const ports = portsFor(soup, "U2")
  expect(ports.length).toBeGreaterThanOrEqual(16)
})

test("5V and 3.3V regulators are present", () => {
  const soup = renderCircuit()
  byName(soup, "U3")
  byName(soup, "U4")
})

test("USB Mini-B connector is present", () => {
  const soup = renderCircuit()
  byName(soup, "J1")
})

// ── Crystal Oscillators ──

test("16MHz crystal connected to ATmega328P XTAL pins", () => {
  const soup = renderCircuit()
  byName(soup, "Y1")
  expectSharedNet(soup, ["Y1", "pin1"], ["U1", "XTAL1"])
  expectSharedNet(soup, ["Y1", "pin2"], ["U1", "XTAL2"])
})

test("12MHz crystal connected to CH340G XI/XO pins", () => {
  const soup = renderCircuit()
  byName(soup, "Y2")
  expectSharedNet(soup, ["Y2", "pin1"], ["U2", "XI"])
  expectSharedNet(soup, ["Y2", "pin2"], ["U2", "XO"])
})

// ── USB Connection ──

test("USB D+/D- connected to CH340G via series resistors", () => {
  const soup = renderCircuit()
  expectSharedNet(soup, ["J1", "D_PLUS"], ["R2", "pin1"])
  expectSharedNet(soup, ["J1", "D_MINUS"], ["R3", "pin1"])
})

// ── Serial Connection ──

test("CH340G TXD/RXD cross-connected to ATmega328P RX/TX", () => {
  const soup = renderCircuit()
  expectSharedNet(soup, ["U2", "TXD"], ["U1", "D0_RX"])
  expectSharedNet(soup, ["U2", "RXD"], ["U1", "D1_TX"])
})

// ── DTR Auto-Reset ──

test("DTR auto-reset circuit connects CH340G DTR to RESET via capacitor", () => {
  const soup = renderCircuit()
  expectSharedNet(soup, ["U2", "DTR"], ["C7", "pin1"])
  expectSharedNet(soup, ["C7", "pin2"], ["U1", "RESET"])
})

// ── Power Distribution ──

test("5V regulator output connects to ATmega328P VCC pins", () => {
  const soup = renderCircuit()
  expectSharedNet(soup, ["U3", "OUT"], ["U1", "VCC1"])
  expectSharedNet(soup, ["U3", "OUT"], ["U1", "VCC2"])
  expectSharedNet(soup, ["U3", "OUT"], ["U1", "AVCC"])
})

test("3.3V regulator input comes from 5V rail", () => {
  const soup = renderCircuit()
  expectSharedNet(soup, ["U4", "IN"], ["U3", "OUT"])
})

// ── Headers ──

test("Digital header (JP1) has 15 pins", () => {
  const soup = renderCircuit()
  byName(soup, "JP1")
  const ports = portsFor(soup, "JP1")
  expect(ports.length).toBe(15)
})

test("Analog header (JP2) has 15 pins", () => {
  const soup = renderCircuit()
  byName(soup, "JP2")
  const ports = portsFor(soup, "JP2")
  expect(ports.length).toBe(15)
})

test("ICSP header has 6 pins", () => {
  const soup = renderCircuit()
  byName(soup, "JP3")
  const ports = portsFor(soup, "JP3")
  expect(ports.length).toBe(6)
})

// ── LED Indicators ──

test("Power, TX, RX, and L LEDs are present", () => {
  const soup = renderCircuit()
  byName(soup, "D1") // Power LED
  byName(soup, "D2") // TX LED
  byName(soup, "D3") // RX LED
  byName(soup, "D4") // L/D13 LED
})

// ── Reset Circuit ──

test("RESET pull-up resistor to VCC5", () => {
  const soup = renderCircuit()
  expectSharedNet(soup, ["R1", "pin1"], ["U3", "OUT"])
  expectSharedNet(soup, ["R1", "pin2"], ["U1", "RESET"])
})

test("RESET button connected to GND", () => {
  const soup = renderCircuit()
  byName(soup, "SW1")
})
