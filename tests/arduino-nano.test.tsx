import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

test("build the Arduino Nano with tscircuit", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="18mm" height="45mm">
      <chip
        name="U1"
        manufacturerPartNumber="ATmega328P-AU"
        footprint="tqfp32"
        pinLabels={{ pin7: "XTAL1", pin8: "XTAL2" }}
        pcbX={0}
        pcbY={0}
      />
      <crystal
        name="Y1"
        frequency="16MHz"
        loadCapacitance="18pF"
        footprint="0402"
        pcbX={-5}
        pcbY={4}
      />
      <chip
        name="U2"
        manufacturerPartNumber="CH340G"
        footprint="soic16"
        pcbX={0}
        pcbY={-16}
      />
      <chip
        name="U3"
        manufacturerPartNumber="AMS1117-5.0"
        footprint="sot223"
        pcbX={5}
        pcbY={16}
      />
      <pinheader
        name="J1"
        pinCount={15}
        gender="male"
        pinLabels={[
          "D1_TX",
          "D0_RX",
          "RST",
          "GND",
          "D2",
          "D3",
          "D4",
          "D5",
          "D6",
          "D7",
          "D8",
          "D9",
          "D10",
          "D11",
          "D12",
        ]}
        pcbX={-7}
        pcbY={0}
      />
      <pinheader
        name="J2"
        pinCount={15}
        gender="male"
        pinLabels={[
          "D13",
          "3V3",
          "AREF",
          "A0",
          "A1",
          "A2",
          "A3",
          "A4",
          "A5",
          "A6",
          "A7",
          "5V",
          "RST",
          "GND",
          "VIN",
        ]}
        pcbX={7}
        pcbY={0}
      />
      <led name="LED1" footprint="0603" pcbX={3} pcbY={8} />
      <resistor
        name="R1"
        resistance="1kohm"
        footprint="0402"
        pcbX={5}
        pcbY={8}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={-3}
        pcbY={-4}
      />
      <capacitor
        name="C2"
        capacitance="10uF"
        footprint="0805"
        pcbX={3}
        pcbY={-4}
      />

      <trace path={[".U1 > .XTAL1", ".Y1 > .pin1"]} />
      <trace path={[".U1 > .XTAL2", ".Y1 > .pin2"]} />
      <trace path={[".J1 > .GND", ".J2 > .GND"]} />
      <trace path={[".J1 > .RST", ".J2 > .RST"]} />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeTruthy()

  const failedComponents = circuitJson
    .filter(
      (element) => element.type === "source_failed_to_create_component_error",
    )
    .map((element) => element.component_name)

  expect(failedComponents).toEqual([])

  const sourceComponentNames = circuitJson
    .filter((element) => element.type === "source_component")
    .map((element) => element.name)

  expect(sourceComponentNames).toContain("U1")
  expect(sourceComponentNames).toContain("J1")
  expect(sourceComponentNames).toContain("J2")
  expect(sourceComponentNames).toContain("Y1")

  const platedHoleCount = circuitJson.filter(
    (element) => element.type === "pcb_plated_hole",
  ).length

  expect(platedHoleCount).toBeGreaterThanOrEqual(30)
}, 30000)
