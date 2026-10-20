import { describe, expect, test } from "bun:test"
import React from "react"
import {
  Circuit,
  checkViaAnnularRing,
  checkMinTraceWidth,
  checkTraceAcuteAngles,
  checkSolderMaskBridge,
  checkSilkscreenOverPads,
  convertCircuitJsonToGerberFiles,
  runAllChecks,
} from "../index"

const rules = {
  minTraceWidth: 0.15,
  minViaHoleDiameter: 0.3,
  minViaPadDiameter: 0.6,
} as const

describe("Issue #5559: JLCDFM gaps across core, checks, and gerber export", () => {
  test("1. A via in a pcbPath defaults to the board's minViaHoleDiameter and minViaPadDiameter", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="10mm" {...rules}>
        <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
        <resistor name="R2" resistance="1k" footprint="0603" pcbX={6} pcbY={0} />
        <trace
          from=".R1 > .pin2"
          to=".R2 > .pin1"
          thickness={0.15}
          pcbPath={[
            { x: 2, y: 2 },
            { x: 2, y: 2, via: true, fromLayer: "top", toLayer: "bottom" },
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 4, y: 2, via: true, fromLayer: "bottom", toLayer: "top" },
            { x: 4, y: 2 },
          ]}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const vias = json.filter((e: any) => e.type === "pcb_via") as any[]

    expect(vias.length).toBe(2)
    for (const via of vias) {
      expect(via.hole_diameter).toBeCloseTo(0.3, 5)
      expect(via.outer_diameter).toBeCloseTo(0.6, 5)
    }
    expect(checkViaAnnularRing(json)).toHaveLength(0)
  })

  test("2. Annular ring and via pad size are checked against board minimums and ring limits", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="10mm" {...rules}>
        <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
        <via
          pcbX={0}
          pcbY={-2.5}
          holeDiameter="0.3mm"
          outerDiameter="0.35mm"
          fromLayer="top"
          toLayer="bottom"
          connectsTo=".R1 > .pin1"
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const ringErrors = checkViaAnnularRing(json)
    expect(ringErrors.length).toBeGreaterThanOrEqual(1)
    expect(ringErrors[0].message).toContain("outer_diameter 0.35mm < min_via_pad_diameter 0.6mm")
    expect(ringErrors[0].message).toContain("annular ring 0.0250mm < minimum 0.1mm")

    const allFindings = [
      ...json.filter((e: any) => /_(error|warning)$/.test(e.type)),
      ...(await runAllChecks(json)),
    ]
    expect(
      allFindings.some((f: any) =>
        f.pcb_trace_error_id?.startsWith("pcb_via_annular_ring_error_"),
      ),
    ).toBe(true)
  })

  test("3. Trace width is checked against pcb_board.min_trace_width", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="10mm" {...rules}>
        <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
        <resistor name="R2" resistance="1k" footprint="0603" pcbX={6} pcbY={0} />
        <trace
          from=".R1 > .pin2"
          to=".R2 > .pin1"
          thickness={0.05}
          pcbPath={[{ x: 3, y: 2 }]}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const widthErrors = checkMinTraceWidth(json)
    expect(widthErrors.length).toBeGreaterThanOrEqual(1)
    expect(widthErrors[0].message).toContain("width 0.05mm < min_trace_width 0.15mm")

    const allFindings = await runAllChecks(json)
    expect(
      allFindings.some((f: any) =>
        f.pcb_trace_error_id?.startsWith("pcb_min_trace_width_error_"),
      ),
    ).toBe(true)
  })

  test("4. Acute angles (< 80 degrees) in traces are reported as warnings", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="10mm" {...rules}>
        <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
        <resistor name="R2" resistance="1k" footprint="0603" pcbX={6} pcbY={0} />
        <trace
          from=".R1 > .pin2"
          to=".R2 > .pin1"
          thickness={0.15}
          pcbPath={[
            { x: 5, y: 2.5 },
            { x: 3.6, y: 2.5 },
          ]}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const acuteWarnings = checkTraceAcuteAngles(json)
    expect(acuteWarnings.length).toBeGreaterThanOrEqual(1)
    expect(acuteWarnings[0].angle_degrees).toBeLessThan(80)
    expect(acuteWarnings[0].center.x).toBeCloseTo(5, 3)
    expect(acuteWarnings[0].center.y).toBeCloseTo(2.5, 3)

    const allFindings = await runAllChecks(json)
    expect(
      allFindings.some((f: any) =>
        f.pcb_trace_warning_id?.startsWith("pcb_trace_acute_angle_"),
      ),
    ).toBe(true)
  })

  test("5. Solder-mask webs (bridges) between openings below 0.10mm are reported", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="10mm" {...rules}>
        <chip
          name="U1"
          pcbX={0}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                shape="rect"
                pcbX={-0.235}
                pcbY={0}
                width={0.35}
                height={1}
                solderMaskMargin={0.05}
              />
              <smtpad
                portHints={["pin2"]}
                shape="rect"
                pcbX={0.235}
                pcbY={0}
                width={0.35}
                height={1}
                solderMaskMargin={0.05}
              />
            </footprint>
          }
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const bridgeErrors = checkSolderMaskBridge(json)
    expect(bridgeErrors.length).toBe(1)
    expect(bridgeErrors[0].actual_clearance).toBeCloseTo(0.02, 4)
    expect(bridgeErrors[0].minimum_clearance).toBeCloseTo(0.1, 4)

    const allFindings = await runAllChecks(json)
    expect(
      allFindings.some((f: any) =>
        f.pcb_pad_pad_clearance_error_id?.startsWith("pcb_solder_mask_bridge_"),
      ),
    ).toBe(true)
  })

  test("6. Silkscreen path and text overlapping pads are reported", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="10mm" {...rules}>
        <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
        <silkscreenpath
          route={[
            { x: -1.5, y: 0 },
            { x: 1.5, y: 0 },
          ]}
          strokeWidth={0.15}
        />
        <silkscreentext text="OVER" pcbX={0.8} pcbY={0} fontSize={0.8} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const silkErrors = checkSilkscreenOverPads(json)
    expect(silkErrors.length).toBe(2)
    expect(
      silkErrors.some((e: any) => e.message.includes("Silkscreen path")),
    ).toBe(true)
    expect(
      silkErrors.some((e: any) => e.message.includes('Silkscreen text "OVER"')),
    ).toBe(true)
  })

  test("7. Gerber export labels ViaDrill/ComponentDrill, emits ViaPad/SMDPad/ComponentPad/Conductor attributes, and flashes pill pads with obround apertures", async () => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="10mm" {...rules}>
        <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
        <chip
          name="U1"
          pcbX={4}
          pcbY={0}
          footprint={
            <footprint>
              <platedhole
                portHints={["pin1"]}
                shape="pill"
                pcbX={0}
                pcbY={-1.5}
                holeWidth={0.6}
                holeHeight={1.6}
                outerWidth={1}
                outerHeight={2}
              />
              <platedhole
                portHints={["pin2"]}
                shape="pill"
                pcbX={0}
                pcbY={1.5}
                holeWidth={0.6}
                holeHeight={1.6}
                outerWidth={1}
                outerHeight={2}
                pcbRotation={90}
              />
            </footprint>
          }
        />
        <via
          pcbX={2}
          pcbY={-2.5}
          holeDiameter="0.3mm"
          outerDiameter="0.6mm"
          fromLayer="top"
          toLayer="bottom"
          connectsTo=".R1 > .pin2"
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const files = convertCircuitJsonToGerberFiles(json)

    const drillFile = files["drill-L1-L2.drl"]
    expect(drillFile).toBeDefined()
    expect(drillFile).toContain(
      "; #@! TA.AperFunction,Plated,PTH,ComponentDrill\nT10C0.600000",
    )
    expect(drillFile).toContain(
      "; #@! TA.AperFunction,Plated,PTH,ViaDrill\nT11C0.300000",
    )

    const fCu = files["F_Cu.gbr"]
    expect(fCu).toBeDefined()
    expect(fCu).toContain("%TA.AperFunction,SMDPad,CuDef*%")
    expect(fCu).toContain("%TA.AperFunction,ComponentPad*%")
    expect(fCu).toContain("%TA.AperFunction,ViaPad*%")
    expect(fCu).toContain("%TA.AperFunction,Conductor*%")
    expect(fCu).toContain("%TO.C,R1*%")
    expect(fCu).toContain("%TO.C,U1*%")

    // Pill pads are defined as Obround (O) apertures and flashed once with D03*, not stroked with D01*
    expect(fCu).toMatch(/%ADD\d+O,1\.000000X2\.000000\*%/)
    expect(fCu).toMatch(/%ADD\d+O,2\.000000X1\.000000\*%/)
    expect(fCu).toContain("X004000000Y-01500000D03*")
    expect(fCu).toContain("X004000000Y001500000D03*")
  })
})
