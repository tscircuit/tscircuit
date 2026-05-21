import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import ArduinoNano from "../snippets/arduino-nano"

test("Arduino Nano compiles without errors", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  expect(circuitJson).toBeTruthy()
  expect(circuitJson.length).toBeGreaterThan(0)
})

test("Arduino Nano has ATmega328P MCU", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const chips = json.filter((el: any) => el.manufacturer_part_number === "ATmega328P-PU")
  expect(chips.length).toBeGreaterThanOrEqual(1)
})

test("Arduino Nano has CH340G USB-UART bridge", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const ch340g = json.filter((el: any) => el.manufacturer_part_number === "CH340G")
  expect(ch340g.length).toBeGreaterThanOrEqual(1)
})

test("Arduino Nano has 16MHz crystal", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const xtal = json.filter((el: any) => el.manufacturer_part_number === "16MHz_Crystal")
  expect(xtal.length).toBeGreaterThanOrEqual(1)
})

test("Arduino Nano has AMS1117-5.0 regulator", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const reg = json.filter((el: any) => el.manufacturer_part_number === "AMS1117-5.0")
  expect(reg.length).toBeGreaterThanOrEqual(1)
})

test("Arduino Nano has power LED", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const leds = json.filter((el: any) => el.name === "PWR_LED")
  expect(leds.length).toBeGreaterThanOrEqual(1)
})

test("Arduino Nano has TX and RX LEDs", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const txLed = json.filter((el: any) => el.name === "TX_LED")
  const rxLed = json.filter((el: any) => el.name === "RX_LED")
  expect(txLed.length).toBeGreaterThanOrEqual(1)
  expect(rxLed.length).toBeGreaterThanOrEqual(1)
})

test("Arduino Nano has ICSP header", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const icsp = json.filter((el: any) => el.name === "ICSP")
  expect(icsp.length).toBeGreaterThanOrEqual(1)
})

test("Arduino Nano has reset circuit (10k pull-up resistor)", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const resistors = json.filter((el: any) => el.name === "R3" && el.resistance === 10000)
  expect(resistors.length).toBeGreaterThanOrEqual(1)
})
