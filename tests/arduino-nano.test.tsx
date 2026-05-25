import { expect, test } from "bun:test"
import { Circuit } from "../dist"
import { ArduinoNano } from "../snippets/arduino-nano"

type SoupElement = Record<string, any>

const renderArduinoNano = () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()
  return circuit.getCircuitJson() as SoupElement[]
}

const byName = (soup: SoupElement[], name: string) => {
  const component = soup.find(
    (element) => element.type === "source_component" && element.name === name,
  )
  expect(component, `missing source component ${name}`).toBeDefined()
  return component!
}

const portsFor = (soup: SoupElement[], componentName: string) => {
  const component = byName(soup, componentName)
  return soup.filter(
    (element) =>
      element.type === "source_port" &&
      element.source_component_id === component.source_component_id,
  )
}

const port = (soup: SoupElement[], componentName: string, label: string) => {
  const match = portsFor(soup, componentName).find((sourcePort) =>
    sourcePort.port_hints?.includes(label),
  )
  expect(match, `missing ${componentName}.${label}`).toBeDefined()
  return match!
}

const portByPinNumber = (
  soup: SoupElement[],
  componentName: string,
  pinNumber: number,
) => {
  const match = portsFor(soup, componentName).find(
    (sourcePort) => sourcePort.pin_number === pinNumber,
  )
  expect(match, `missing ${componentName} pin ${pinNumber}`).toBeDefined()
  return match!
}

const netKey = (soup: SoupElement[], componentName: string, label: string) =>
  port(soup, componentName, label).subcircuit_connectivity_map_key

const netKeyByPinNumber = (
  soup: SoupElement[],
  componentName: string,
  pinNumber: number,
) => portByPinNumber(soup, componentName, pinNumber).subcircuit_connectivity_map_key

const expectSharedNet = (
  soup: SoupElement[],
  left: [string, string],
  right: [string, string],
) => {
  expect(netKey(soup, ...left), `${left.join(".")} net`).toBe(
    netKey(soup, ...right),
  )
}

const sourceNet = (soup: SoupElement[], name: string) => {
  const net = soup.find(
    (element) => element.type === "source_net" && element.name === name,
  )
  expect(net, `missing source net ${name}`).toBeDefined()
  return net!
}

test("Arduino Nano exposes the official dual 15-pin public header map", () => {
  const soup = renderArduinoNano()

  const leftHeaderLabels = portsFor(soup, "J_LEFT").map((p) => p.name)
  const rightHeaderLabels = portsFor(soup, "J_RIGHT").map((p) => p.name)

  expect(leftHeaderLabels).toEqual([
    "D1_TX",
    "D0_RX",
    "RESET",
    "GND",
    "D2",
    "D3",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
    "D9",
    "D10_SS",
    "D11_MOSI",
    "D12_MISO",
  ])
  expect(rightHeaderLabels).toEqual([
    "VIN",
    "GND",
    "RESET",
    "5V",
    "A7",
    "A6",
    "A5_SCL",
    "A4_SDA",
    "A3",
    "A2",
    "A1",
    "A0",
    "AREF",
    "3V3",
    "D13_SCK_L",
  ])
})

test("Arduino Nano has Nano-size board, MCU, USB bridge, regulators, USB, and LEDs", () => {
  const soup = renderArduinoNano()
  const board = soup.find((element) => element.type === "pcb_board")

  expect(board?.width).toBe(45)
  expect(board?.height).toBe(18)

  expect(byName(soup, "U1").manufacturer_part_number).toBe("ATmega328P-AU")
  expect(byName(soup, "U2").manufacturer_part_number).toBe("CH340G")
  expect(byName(soup, "U3").manufacturer_part_number).toBe("AMS1117-5.0")
  expect(byName(soup, "U4").manufacturer_part_number).toBe("AMS1117-3.3")
  expect(byName(soup, "J_USB").manufacturer_part_number).toBe("USB-MINI-B")

  for (const name of ["LED_PWR", "LED_TX", "LED_RX", "LED_L"]) {
    expect(byName(soup, name)).toBeDefined()
  }
})

test("Arduino Nano renders without source-level fabrication errors or untraced pins", () => {
  const soup = renderArduinoNano()
  const sourceIssues = soup.filter(
    (element) =>
      typeof element.type === "string" &&
      (element.type.startsWith("source_") &&
        (element.type.endsWith("_error") ||
          element.type.endsWith("_warning"))),
  )

  expect(sourceIssues).toEqual([])
})

test("Arduino Nano wires both clock domains with load capacitors", () => {
  const soup = renderArduinoNano()

  expect(byName(soup, "Y1_16MHZ").manufacturer_part_number).toBe(
    "16MHz Crystal",
  )
  expect(byName(soup, "Y2_12MHZ").manufacturer_part_number).toBe(
    "12MHz Crystal",
  )

  expectSharedNet(soup, ["U1", "XTAL1"], ["Y1_16MHZ", "XTAL1"])
  expectSharedNet(soup, ["U1", "XTAL2"], ["Y1_16MHZ", "XTAL2"])
  expectSharedNet(soup, ["U2", "XI"], ["Y2_12MHZ", "XI"])
  expectSharedNet(soup, ["U2", "XO"], ["Y2_12MHZ", "XO"])
  expectSharedNet(soup, ["C1", "pin1"], ["Y1_16MHZ", "XTAL1"])
  expectSharedNet(soup, ["C2", "pin1"], ["Y1_16MHZ", "XTAL2"])
  expectSharedNet(soup, ["C3", "pin1"], ["Y2_12MHZ", "XI"])
  expectSharedNet(soup, ["C4", "pin1"], ["Y2_12MHZ", "XO"])
})

test("Arduino Nano maps CH340G SOP-16 pins to the correct physical nets", () => {
  const soup = renderArduinoNano()
  const expectedU2PinMap: Array<
    [number, string, string, string]
  > = [
    [1, "GND", "J_LEFT", "GND"],
    [2, "TXD", "U1", "D0_RX"],
    [3, "RXD", "U1", "D1_TX"],
    [4, "V3", "J_RIGHT", "3V3"],
    [5, "UD_PLUS", "J_USB", "D_PLUS"],
    [6, "UD_MINUS", "J_USB", "D_MINUS"],
    [7, "XI", "Y2_12MHZ", "XI"],
    [8, "XO", "Y2_12MHZ", "XO"],
    [9, "CTS", "J_LEFT", "GND"],
    [10, "DSR", "J_LEFT", "GND"],
    [11, "RI", "J_LEFT", "GND"],
    [12, "DCD", "J_LEFT", "GND"],
    [13, "DTR", "C_RESET", "pin1"],
    [14, "RTS", "J_LEFT", "GND"],
    [15, "R232", "J_LEFT", "GND"],
    [16, "VCC", "J_RIGHT", "5V"],
  ]

  for (const [pinNumber, label, componentName, componentPin] of expectedU2PinMap) {
    const sourcePort = portByPinNumber(soup, "U2", pinNumber)
    expect(sourcePort.name, `U2 pin ${pinNumber} label`).toBe(label)
    expect(
      netKeyByPinNumber(soup, "U2", pinNumber),
      `U2 pin ${pinNumber} net`,
    ).toBe(netKey(soup, componentName, componentPin))
  }
})

test("Arduino Nano connects serial, reset, ICSP, analog, and power nets", () => {
  const soup = renderArduinoNano()

  expectSharedNet(soup, ["J_LEFT", "D0_RX"], ["U1", "D0_RX"])
  expectSharedNet(soup, ["J_LEFT", "D1_TX"], ["U1", "D1_TX"])
  expectSharedNet(soup, ["U2", "TXD"], ["U1", "D0_RX"])
  expectSharedNet(soup, ["U2", "RXD"], ["U1", "D1_TX"])
  expectSharedNet(soup, ["U2", "DTR"], ["C_RESET", "pin1"])
  expectSharedNet(soup, ["C_RESET", "pin2"], ["U1", "RESET"])
  expectSharedNet(soup, ["SW_RESET", "pin1"], ["U1", "RESET"])

  expectSharedNet(soup, ["ICSP", "MISO"], ["U1", "D12_MISO"])
  expectSharedNet(soup, ["ICSP", "MOSI"], ["U1", "D11_MOSI"])
  expectSharedNet(soup, ["ICSP", "SCK"], ["U1", "D13_SCK"])
  expectSharedNet(soup, ["ICSP", "RESET"], ["U1", "RESET"])

  expectSharedNet(soup, ["J_RIGHT", "A0"], ["U1", "A0"])
  expectSharedNet(soup, ["J_RIGHT", "A7"], ["U1", "A7"])
  expectSharedNet(soup, ["J_RIGHT", "AREF"], ["U1", "AREF"])
  expectSharedNet(soup, ["J_RIGHT", "D13_SCK_L"], ["LED_L_R", "pin1"])

  for (const netName of ["VIN", "VUSB", "VCC5", "VCC3V3", "GND"]) {
    sourceNet(soup, netName)
  }
  expectSharedNet(soup, ["J_USB", "D_PLUS"], ["U2", "UD_PLUS"])
  expectSharedNet(soup, ["J_USB", "D_MINUS"], ["U2", "UD_MINUS"])
  expectSharedNet(soup, ["J_RIGHT", "5V"], ["U3", "OUT"])
  expectSharedNet(soup, ["J_RIGHT", "3V3"], ["U4", "OUT"])
})
