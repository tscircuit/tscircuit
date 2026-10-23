import React from "react"
import { test, expect } from "bun:test"
import {
  Circuit,
  NetTie,
  filterDrcErrorsForNetTies,
  findNetTiesInCircuit,
} from "../dist"
import { checkPadPadClearance } from "@tscircuit/checks"

test("NetTie joins two named nets (AGND and GND) without merging them globally", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={30} height={30}>
      {/* Resistor on analog ground */}
      <resistor
        name="R_ANALOG"
        resistance="10k"
        footprint="0805"
        pcbX={-8}
        pcbY={5}
      />
      <trace from="R_ANALOG .pin1" to="net.AGND" />

      {/* Resistor on digital ground */}
      <resistor
        name="R_DIGITAL"
        resistance="10k"
        footprint="0805"
        pcbX={8}
        pcbY={5}
      />
      <trace from="R_DIGITAL .pin1" to="net.GND" />

      {/* NetTie joining AGND and GND at one star point */}
      <NetTie
        name="NT1"
        connects={["net.AGND", "net.GND"]}
        footprint="net_tie_0805"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  // 1. Verify two distinct source nets exist
  const sourceNets = circuitJson.filter((e) => e.type === "source_net")
  const netNames = sourceNets.map((n: any) => n.name)
  expect(netNames).toContain("AGND")
  expect(netNames).toContain("GND")

  // Verify they have different connectivity keys
  const agnd = sourceNets.find((n: any) => n.name === "AGND") as any
  const gnd = sourceNets.find((n: any) => n.name === "GND") as any
  expect(agnd.subcircuit_connectivity_map_key).not.toBe(
    gnd.subcircuit_connectivity_map_key,
  )

  // 2. Verify NetTie was detected by net tie inspection
  const netTies = findNetTiesInCircuit(circuitJson)
  expect(netTies.length).toBe(1)
  expect(netTies[0].componentName).toBe("NT1")
  expect(netTies[0].pads.length).toBe(3) // pad1, pad2, bridge pad

  // 3. Verify DRC filtering:
  // Raw DRC reports clearance errors for intentional overlapping pads within the net tie
  const rawClearanceErrors = checkPadPadClearance(circuitJson)
  expect(rawClearanceErrors.length).toBeGreaterThan(0)

  // Filtered DRC exempts internal net-tie bridges
  const filteredErrors = filterDrcErrorsForNetTies(rawClearanceErrors, circuitJson)
  expect(filteredErrors.length).toBe(0)
})

test("DRC catches accidental shorts between tied nets outside the NetTie", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={30} height={30}>
      {/* Two separate resistors whose pads are placed right on top of each other (accidental short) */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={-5}
        pcbY={5}
      />
      <trace from="R1 .pin1" to="net.AGND" />

      <resistor
        name="R2"
        resistance="10k"
        footprint="0805"
        pcbX={-5.2} // 0.2mm away -> pads will overlap/violate clearance
        pcbY={5}
      />
      <trace from="R2 .pin1" to="net.GND" />

      {/* NetTie at (0, 0) */}
      <NetTie
        name="NT1"
        connects={["net.AGND", "net.GND"]}
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const rawClearanceErrors = checkPadPadClearance(circuitJson)
  const filteredErrors = filterDrcErrorsForNetTies(rawClearanceErrors, circuitJson)

  // The accidental short between R1 and R2 must NOT be exempted!
  expect(filteredErrors.length).toBeGreaterThan(0)
})

test("NetTie supports custom dimensions", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={20} height={20}>
      <NetTie
        name="NT_CUSTOM"
        net1="VOUT"
        net2="VOUT_SENSE"
        pcbX={2}
        pcbY={3}
        padWidth="1mm"
        padHeight="1.5mm"
        gap="0.5mm"
        bridgeWidth="0.4mm"
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const netTies = findNetTiesInCircuit(circuitJson)
  expect(netTies.length).toBe(1)
  expect(netTies[0].componentName).toBe("NT_CUSTOM")
})
