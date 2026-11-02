import { describe, expect, test } from "bun:test"
import {
  getFullConnectivityMapFromCircuitJson,
  getSourcePortConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import React from "react"
import {
  Circuit,
  NetTie,
  checkEachPcbTraceNonOverlapping,
  checkPadPadClearance,
  checkPadTraceClearance,
  runAllPlacementChecks,
  runAllRoutingChecks,
  runTscircuitCode,
  useNetTie,
} from "../dist"

describe("NetTie (#5809)", () => {
  test("joins two named nets at one copper bridge point while keeping nets separate in netlist and connectivity maps", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="12mm" routingDisabled>
        <net name="AGND" />
        <net name="DGND" />
        <resistor
          name="R_ANALOG"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={0}
          connections={{ pin2: "net.AGND" }}
        />
        <resistor
          name="R_DIGITAL"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={0}
          connections={{ pin1: "net.DGND" }}
        />
        <nettie name="NT1" nets={["net.AGND", "net.DGND"]} pcbX={0} pcbY={0} />
      </board>,
    )

    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()

    const sourceNets = circuitJson.filter((elm) => elm.type === "source_net")
    expect(sourceNets.map((n: any) => n.name).sort()).toEqual(["AGND", "DGND"])

    const ntSourceComp = circuitJson.find(
      (elm: any) => elm.type === "source_component" && elm.name === "NT1",
    ) as any
    expect(ntSourceComp).toBeDefined()
    expect(ntSourceComp.internally_connected_source_port_ids).toBeUndefined()

    const internalConns = circuitJson.filter(
      (elm: any) =>
        elm.type === "source_component_internal_connection" &&
        elm.source_component_id === ntSourceComp.source_component_id,
    )
    expect(internalConns).toHaveLength(0)

    const agndNet = sourceNets.find((n: any) => n.name === "AGND") as any
    const dgndNet = sourceNets.find((n: any) => n.name === "DGND") as any
    const sourceConnMap =
      getSourcePortConnectivityMapFromCircuitJson(circuitJson)
    const fullConnMap = getFullConnectivityMapFromCircuitJson(circuitJson)

    expect(
      sourceConnMap.areIdsConnected(
        agndNet.source_net_id,
        dgndNet.source_net_id,
      ),
    ).toBe(false)
    expect(
      fullConnMap.areIdsConnected(agndNet.source_net_id, dgndNet.source_net_id),
    ).toBe(false)

    // Verify NetTie PCB footprint has port pads + solder-mask-covered copper bridge at (0, 0)
    const ntPcbComp = circuitJson.find(
      (elm: any) =>
        elm.type === "pcb_component" &&
        elm.source_component_id === ntSourceComp.source_component_id,
    ) as any
    expect(ntPcbComp).toBeDefined()
    expect(ntPcbComp.metadata?.is_net_tie).toBe(true)

    const ntPads = circuitJson.filter(
      (elm: any) =>
        elm.type === "pcb_smtpad" &&
        elm.pcb_component_id === ntPcbComp.pcb_component_id,
    ) as any[]
    expect(ntPads).toHaveLength(3)
    const bridgePad = ntPads.find((p) => !p.pcb_port_id)
    expect(bridgePad).toBeDefined()
    expect(bridgePad.is_covered_with_solder_mask).toBe(true)
    expect(bridgePad.x).toBeCloseTo(0, 5)
    expect(bridgePad.y).toBeCloseTo(0, 5)

    // DRC should produce zero pad-pad or placement/routing errors for the NetTie itself
    expect(checkPadPadClearance(circuitJson)).toHaveLength(0)
    expect(await runAllPlacementChecks(circuitJson)).toHaveLength(0)
  })

  test("supports single-pad net-tie mode (shape='pad') and 3+ nets (AGND, DGND, PGND)", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="12mm" routingDisabled>
        <nettie
          name="NT_PAD"
          shape="pad"
          from="AGND"
          to="DGND"
          padWidth="0.6mm"
          padHeight="0.4mm"
          pcbX={-3}
          pcbY={0}
        />
        <NetTie
          name="NT_STAR"
          nets={["AGND", "DGND", "PGND"]}
          pcbX={3}
          pcbY={0}
        />
      </board>,
    )

    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()

    const sourceNets = circuitJson.filter((elm) => elm.type === "source_net")
    expect(sourceNets.map((n: any) => n.name).sort()).toEqual([
      "AGND",
      "DGND",
      "PGND",
    ])

    const agnd = sourceNets.find((n: any) => n.name === "AGND") as any
    const dgnd = sourceNets.find((n: any) => n.name === "DGND") as any
    const pgnd = sourceNets.find((n: any) => n.name === "PGND") as any
    const fullConnMap = getFullConnectivityMapFromCircuitJson(circuitJson)

    expect(
      fullConnMap.areIdsConnected(agnd.source_net_id, dgnd.source_net_id),
    ).toBe(false)
    expect(
      fullConnMap.areIdsConnected(agnd.source_net_id, pgnd.source_net_id),
    ).toBe(false)
    expect(
      fullConnMap.areIdsConnected(dgnd.source_net_id, pgnd.source_net_id),
    ).toBe(false)

    expect(checkPadPadClearance(circuitJson)).toHaveLength(0)
    expect(await runAllPlacementChecks(circuitJson)).toHaveLength(0)
  })

  test("DRC exempts the net-tie junction but flags shorts and clearance errors between tied nets elsewhere on the board", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="24mm" height="14mm">
        <net name="AGND" />
        <net name="DGND" />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-6}
          pcbY={0}
          connections={{ pin2: "net.AGND" }}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={6}
          pcbY={0}
          connections={{ pin1: "net.DGND" }}
        />
        <nettie name="NT1" nets={["net.AGND", "net.DGND"]} pcbX={0} pcbY={0} />
      </board>,
    )

    await circuit.renderUntilSettled()
    const cleanCircuitJson = circuit.getCircuitJson()

    // Clean board with NetTie has no pad-pad, pad-trace, or trace overlap DRC errors
    expect(checkPadPadClearance(cleanCircuitJson)).toHaveLength(0)
    expect(checkPadTraceClearance(cleanCircuitJson)).toHaveLength(0)
    expect(checkEachPcbTraceNonOverlapping(cleanCircuitJson)).toHaveLength(0)

    const boardDrcErrors = cleanCircuitJson.filter(
      (elm: any) =>
        elm.type === "pcb_pad_pad_clearance_error" ||
        elm.type === "pcb_pad_trace_clearance_error" ||
        elm.type === "pcb_trace_error" ||
        elm.type === "pcb_footprint_overlap_error",
    )
    expect(boardDrcErrors).toHaveLength(0)

    // Now introduce an accidental short between AGND and DGND away from the NetTie (at y = 4mm)
    const agndPort = cleanCircuitJson.find(
      (elm: any) =>
        elm.type === "pcb_port" &&
        cleanCircuitJson.some(
          (sp: any) =>
            sp.type === "source_port" &&
            sp.source_port_id === elm.source_port_id &&
            getFullConnectivityMapFromCircuitJson(
              cleanCircuitJson,
            ).areIdsConnected(
              sp.source_port_id,
              (
                cleanCircuitJson.find(
                  (n: any) => n.type === "source_net" && n.name === "AGND",
                ) as any
              ).source_net_id,
            ),
        ),
    ) as any
    const dgndPort = cleanCircuitJson.find(
      (elm: any) =>
        elm.type === "pcb_port" &&
        cleanCircuitJson.some(
          (sp: any) =>
            sp.type === "source_port" &&
            sp.source_port_id === elm.source_port_id &&
            getFullConnectivityMapFromCircuitJson(
              cleanCircuitJson,
            ).areIdsConnected(
              sp.source_port_id,
              (
                cleanCircuitJson.find(
                  (n: any) => n.type === "source_net" && n.name === "DGND",
                ) as any
              ).source_net_id,
            ),
        ),
    ) as any

    const shortedCircuitJson = [
      ...cleanCircuitJson,
      {
        type: "pcb_trace" as const,
        pcb_trace_id: "trace_agnd_elsewhere",
        route: [
          {
            route_type: "wire" as const,
            x: -4,
            y: 4,
            width: 0.15,
            layer: "top" as const,
            start_pcb_port_id: agndPort.pcb_port_id,
          },
          {
            route_type: "wire" as const,
            x: 2,
            y: 4,
            width: 0.15,
            layer: "top" as const,
          },
        ],
      },
      {
        type: "pcb_trace" as const,
        pcb_trace_id: "trace_dgnd_elsewhere",
        route: [
          {
            route_type: "wire" as const,
            x: -2,
            y: 4,
            width: 0.15,
            layer: "top" as const,
            start_pcb_port_id: dgndPort.pcb_port_id,
          },
          {
            route_type: "wire" as const,
            x: 4,
            y: 4,
            width: 0.15,
            layer: "top" as const,
          },
        ],
      },
    ]

    const traceOverlapErrors =
      checkEachPcbTraceNonOverlapping(shortedCircuitJson)
    expect(traceOverlapErrors.length).toBeGreaterThan(0)
    expect(
      traceOverlapErrors.some(
        (e: any) =>
          e.type === "pcb_trace_error" &&
          e.pcb_trace_error_id.includes("trace_agnd_elsewhere") &&
          e.pcb_trace_error_id.includes("trace_dgnd_elsewhere"),
      ),
    ).toBe(true)

    const routingErrors = await runAllRoutingChecks(shortedCircuitJson as any)
    expect(
      routingErrors.some(
        (e: any) =>
          e.type === "pcb_trace_error" &&
          e.pcb_trace_error_id.includes("trace_agnd_elsewhere"),
      ),
    ).toBe(true)
  })

  test("works with useNetTie hook and runTscircuitCode", async () => {
    const HookBoard = () => {
      const GndTie = useNetTie("NT_HOOK", {
        nets: ["net.AGND", "net.DGND"],
      })
      return (
        <board width="12mm" height="10mm" routingDisabled>
          <GndTie pcbX={0} pcbY={0} />
        </board>
      )
    }

    const circuit = new Circuit()
    circuit.add(<HookBoard />)
    await circuit.renderUntilSettled()
    const hookJson = circuit.getCircuitJson()
    expect(
      hookJson.some(
        (e: any) => e.type === "source_component" && e.name === "NT_HOOK",
      ),
    ).toBe(true)

    const evalCircuitJson = await runTscircuitCode(`
      import { NetTie } from "tscircuit"

      export default () => (
        <board width="14mm" height="10mm" routingDisabled>
          <nettie name="NT_JSX" nets={["AGND", "DGND"]} pcbX={-2} pcbY={0} />
          <NetTie name="NT_COMP" from="AGND" to="PGND" shape="pad" pcbX={2} pcbY={0} />
        </board>
      )
    `)

    const sourceComps = evalCircuitJson.filter(
      (e: any) => e.type === "source_component",
    ) as any[]
    expect(sourceComps.map((c) => c.name).sort()).toEqual(["NT_COMP", "NT_JSX"])
  })

  test("flags pad-pad clearance error when tied nets are placed too close outside the NetTie and keeps copper pours separate", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="12mm" routingDisabled>
        <net name="AGND" />
        <net name="DGND" />
        <nettie name="NT1" nets={["net.AGND", "net.DGND"]} pcbX={-5} pcbY={0} />
        <testpoint
          name="TP_AGND"
          footprintVariant="pad"
          padShape="rect"
          width="1mm"
          height="1mm"
          pcbX={4}
          pcbY={0}
          connections={{ pin1: "net.AGND" }}
        />
        <testpoint
          name="TP_DGND"
          footprintVariant="pad"
          padShape="rect"
          width="1mm"
          height="1mm"
          pcbX={5.05}
          pcbY={0}
          connections={{ pin1: "net.DGND" }}
        />
        <copperpour connectsTo="net.AGND" layer="top" clearance="0.2mm" />
      </board>,
    )

    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()

    // TP_AGND and TP_DGND have a 0.05mm gap (< 0.1mm minimum clearance) outside NT1,
    // so checkPadPadClearance must report an error for TP_AGND/TP_DGND, NOT for NT1!
    const padClearanceErrors = checkPadPadClearance(circuitJson)
    expect(padClearanceErrors).toHaveLength(1)
    expect(padClearanceErrors[0].message).toContain("TP_AGND")
    expect(padClearanceErrors[0].message).toContain("TP_DGND")

    // Copper pour for AGND is bound strictly to AGND's source_net_id
    const agndNet = circuitJson.find(
      (e: any) => e.type === "source_net" && e.name === "AGND",
    ) as any
    const pours = circuitJson.filter(
      (e: any) => e.type === "pcb_copper_pour",
    ) as any[]
    expect(pours.length).toBeGreaterThan(0)
    expect(pours.every((p) => p.source_net_id === agndNet.source_net_id)).toBe(
      true,
    )
  })
})
