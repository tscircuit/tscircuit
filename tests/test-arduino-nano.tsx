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

test("Arduino Nano has correct board dimensions (45mm × 18mm)", () => {
  const soup = renderArduinoNano()
  const board = soup.find((element) => element.type === "pcb_board")
  expect(board?.width).toBe(45)
  expect(board?.height).toBe(18)
})

test("Arduino Nano has all major ICs and connectors", () => {
  const soup = renderArduinoNano()
  expect(byName(soup, "U1").manufacturer_part_number).toBe("ATmega328P-AU")
  expect(byName(soup, "U2").manufacturer_part_number).toBe("CH340G")
  expect(byName(soup, "U3").manufacturer_part_number).toBe("AMS1117-5.0")
  expect(byName(soup, "U4").manufacturer_part_number).toBe("AMS1117-3.3")
  expect(byName(soup, "J_USB").manufacturer_part_number).toBe("USB-MINI-B")
  for (const name of ["LED_PWR", "LED_TX", "LED_RX", "LED_L"]) {
    expect(byName(soup, name)).toBeDefined()
  }
})

test("Arduino Nano renders without source-level errors", () => {
  const soup = renderArduinoNano()
  const sourceIssues = soup.filter(
    (element) =>
      typeof element.type === "string" &&
      element.type.startsWith("source_") &&
      (element.type.endsWith("_error") || element.type.endsWith("_warning")),
  )
  expect(sourceIssues).toEqual([])
})

test("Arduino Nano has dual clock domains: 16MHz for MCU and 12MHz for CH340G", () => {
  const soup = renderArduinoNano()
  expect(byName(soup, "Y1").manufacturer_part_number).toBe("16MHz")
  expect(byName(soup, "Y2").manufacturer_part_number).toBe("12MHz")
  // 16MHz crystal wired to ATmega328P XTAL pins
  expectSharedNet(soup, ["U1", "XTAL1"], ["Y1", "XTAL1"])
  expectSharedNet(soup, ["U1", "XTAL2"], ["Y1", "XTAL2"])
  // 12MHz crystal wired to CH340G XI/XO pins
  expectSharedNet(soup, ["U2", "XI"], ["Y2", "XI"])
  expectSharedNet(soup, ["U2", "XO"], ["Y2", "XO"])
  // Load capacitors on both crystals
  expectSharedNet(soup, ["C1", "pin1"], ["Y1", "XTAL1"])
  expectSharedNet(soup, ["C2", "pin1"], ["Y1", "XTAL2"])
  expectSharedNet(soup, ["C3", "pin1"], ["Y2", "XI"])
  expectSharedNet(soup, ["C4", "pin1"], ["Y2", "XO"])
})

test("Arduino Nano exposes standard dual 15-pin public header map (JP1 + JP2)", () => {
  const soup = renderArduinoNano()
  const jp1Labels = portsFor(soup, "JP1").map((p) => p.name)
  const jp2Labels = portsFor(soup, "JP2").map((p) => p.name)
  expect(jp1Labels).toEqual([
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
  expect(jp2Labels).toEqual([
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
    "D13_SCK",
  ])
})

test("Arduino Nano maps CH340G SOIC-16 pins to the correct physical nets", () => {
  const soup = renderArduinoNano()
  // CH340G SOIC-16 pinmap: [pinNumber, pinLabel, connectedComponent, connectedPin]
  // pin1=TXD→U1.D0_RX, pin2=RXD→U1.D1_TX, pin3=V3→VCC3V3,
  // pin4=UD_PLUS→J_USB.D_PLUS, pin5=UD_MINUS→J_USB.D_MINUS,
  // pin6=XI→Y2.XI, pin7=XO→Y2.XO, pin8=TEST→GND,
  // pin9=GND→GND, pin10-13=CTS/DSR/RI/DCD→GND, pin14=DTR→C_RESET.pin1,
  // pin15=RTS→GND, pin16=VCC→VCC5
  const expectedPinLabels: Array<[number, string]> = [
    [1, "TXD"],
    [2, "RXD"],
    [3, "V3"],
    [4, "UD_PLUS"],
    [5, "UD_MINUS"],
    [6, "XI"],
    [7, "XO"],
    [8, "TEST"],
    [9, "GND"],
    [10, "CTS"],
    [11, "DSR"],
    [12, "RI"],
    [13, "DCD"],
    [14, "DTR"],
    [15, "RTS"],
    [16, "VCC"],
  ]
  for (const [pinNumber, label] of expectedPinLabels) {
    const sourcePort = portByPinNumber(soup, "U2", pinNumber)
    expect(sourcePort.name, `U2 pin ${pinNumber} label`).toBe(label)
  }
  // Verify key net connections via pin number
  expect(
    netKeyByPinNumber(soup, "U2", 1),
    "U2 pin1 TXD → U1.D0_RX",
  ).toBe(netKey(soup, "U1", "D0_RX"))
  expect(
    netKeyByPinNumber(soup, "U2", 2),
    "U2 pin2 RXD → U1.D1_TX",
  ).toBe(netKey(soup, "U1", "D1_TX"))
  expect(
    netKeyByPinNumber(soup, "U2", 4),
    "U2 pin4 UD_PLUS → J_USB.D_PLUS",
  ).toBe(netKey(soup, "J_USB", "D_PLUS"))
  expect(
    netKeyByPinNumber(soup, "U2", 5),
    "U2 pin5 UD_MINUS → J_USB.D_MINUS",
  ).toBe(netKey(soup, "J_USB", "D_MINUS"))
  expect(
    netKeyByPinNumber(soup, "U2", 6),
    "U2 pin6 XI → Y2.XI",
  ).toBe(netKey(soup, "Y2", "XI"))
  expect(
    netKeyByPinNumber(soup, "U2", 7),
    "U2 pin7 XO → Y2.XO",
  ).toBe(netKey(soup, "Y2", "XO"))
  expect(
    netKeyByPinNumber(soup, "U2", 14),
    "U2 pin14 DTR → C_RESET.pin1",
  ).toBe(netKey(soup, "C_RESET", "pin1"))
})

test("Arduino Nano connects serial, reset, ICSP, analog, and power nets", () => {
  const soup = renderArduinoNano()
  // Serial: CH340G TXD -> MCU RX, CH340G RXD -> MCU TX
  expectSharedNet(soup, ["JP1", "D0_RX"], ["U1", "D0_RX"])
  expectSharedNet(soup, ["JP1", "D1_TX"], ["U1", "D1_TX"])
  expectSharedNet(soup, ["U2", "TXD"], ["U1", "D0_RX"])
  expectSharedNet(soup, ["U2", "RXD"], ["U1", "D1_TX"])
  // Auto-reset: CH340G DTR -> 100nF cap -> RESET
  expectSharedNet(soup, ["U2", "DTR"], ["C_RESET", "pin1"])
  expectSharedNet(soup, ["C_RESET", "pin2"], ["U1", "RESET"])
  expectSharedNet(soup, ["SW_RESET", "pin1"], ["U1", "RESET"])
  // ICSP header
  expectSharedNet(soup, ["ICSP", "MISO"], ["U1", "D12_MISO"])
  expectSharedNet(soup, ["ICSP", "MOSI"], ["U1", "D11_MOSI"])
  expectSharedNet(soup, ["ICSP", "SCK"], ["U1", "D13_SCK"])
  expectSharedNet(soup, ["ICSP", "RESET"], ["U1", "RESET"])
  // Analog pins
  expectSharedNet(soup, ["JP2", "A0"], ["U1", "A0"])
  expectSharedNet(soup, ["JP2", "A7"], ["U1", "A7"])
  expectSharedNet(soup, ["JP2", "AREF"], ["U1", "AREF"])
  // USB differential pair
  expectSharedNet(soup, ["J_USB", "D_PLUS"], ["U2", "UD_PLUS"])
  expectSharedNet(soup, ["J_USB", "D_MINUS"], ["U2", "UD_MINUS"])
  // Power rails present
  for (const netName of ["VIN", "VUSB", "VCC5", "VCC3V3", "GND"]) {
    sourceNet(soup, netName)
  }
  // Regulator outputs at headers
  expectSharedNet(soup, ["JP2", "5V"], ["U3", "OUT"])
  expectSharedNet(soup, ["JP2", "3V3"], ["U4", "OUT"])
  // D13 LED driven by ATmega D13_SCK via current-limiting resistor
  expectSharedNet(soup, ["R_LED_L", "pin1"], ["U1", "D13_SCK"])
})
