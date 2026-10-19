import { expect, test } from "bun:test"
import {
  Circuit,
  ClearanceMatrix,
  NetClass,
  checkDifferentNetViaSpacing,
  checkEachPcbTraceNonOverlapping,
  checkPadPadClearance,
  checkPadTraceClearance,
  checkViaPadClearance,
  checkViaTraceClearance,
  createNetClassResolver,
  getClearanceFromWorkingVoltage,
  runAllChecks,
  runAllPlacementChecks,
  runAllRoutingChecks,
  useClearanceMatrix,
  useNetClass,
} from "../index"

test("working-voltage table computes IPC-2221B clearances and netclass uses workingVoltage when clearance is omitted", async () => {
  expect(getClearanceFromWorkingVoltage(12)).toBe(0.1)
  expect(getClearanceFromWorkingVoltage("24V")).toBe(0.15)
  expect(getClearanceFromWorkingVoltage("48V")).toBe(0.25)
  expect(getClearanceFromWorkingVoltage(100)).toBe(0.6)
  expect(getClearanceFromWorkingVoltage("200V")).toBe(1.5)
  expect(getClearanceFromWorkingVoltage("400V")).toBe(2.5)
  expect(getClearanceFromWorkingVoltage("1kV")).toBe(5.0)
  expect(
    getClearanceFromWorkingVoltage("400V", { environment: "external_coated" }),
  ).toBe(0.8)
  expect(
    getClearanceFromWorkingVoltage("400V", { environment: "internal" }),
  ).toBe(0.25)

  const circuit = new Circuit()
  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <net name="MAINS_HOT" />
      <net name="LOGIC_3V3" />
      <netclass
        name="HV_MAINS"
        workingVoltage="400V"
        traceWidth="0.5mm"
        nets={["net.MAINS_HOT"]}
      />
      <netclass
        name="LV_LOGIC"
        workingVoltage="3.3V"
        traceWidth="0.15mm"
        nets={["net.LOGIC_3V3"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const cj = circuit.getCircuitJson()
  const resolver = createNetClassResolver(cj)

  const hvClass = resolver.netClassesByName.get("HV_MAINS")
  const lvClass = resolver.netClassesByName.get("LV_LOGIC")
  expect(hvClass).toBeDefined()
  expect(hvClass?.clearance).toBe(2.5)
  expect(hvClass?.workingVoltage).toBe(400)
  expect(hvClass?.traceWidth).toBe(0.5)
  expect(lvClass).toBeDefined()
  expect(lvClass?.clearance).toBe(0.1)
  expect(
    resolver.getRequiredClearanceBetweenClasses("HV_MAINS", "LV_LOGIC", 0.15),
  ).toBe(2.5)
})

test("clearance matrix resolves pairwise class-to-class clearances symmetrically", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <net name="HV_POS" />
      <net name="HV_NEG" />
      <net name="LV_SIG1" />
      <net name="LV_SIG2" />
      <netclass name="HV" clearance="2mm" nets={["net.HV_POS", "net.HV_NEG"]} />
      <netclass
        name="LV"
        clearance="0.15mm"
        nets={["net.LV_SIG1", "net.LV_SIG2"]}
      />
      <clearancematrix
        defaultClearance="0.15mm"
        matrix={{
          HV: { LV: "3.2mm", HV: "1.8mm" },
          LV: { LV: "0.15mm" },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const resolver = createNetClassResolver(circuit.getCircuitJson())

  expect(
    resolver.getRequiredClearanceBetweenClasses("HV", "LV", 0.15),
  ).toBeCloseTo(3.2, 5)
  expect(
    resolver.getRequiredClearanceBetweenClasses("LV", "HV", 0.15),
  ).toBeCloseTo(3.2, 5)
  expect(
    resolver.getRequiredClearanceBetweenClasses("HV", "HV", 0.15),
  ).toBeCloseTo(1.8, 5)
  expect(
    resolver.getRequiredClearanceBetweenClasses("LV", "LV", 0.15),
  ).toBeCloseTo(0.15, 5)
})

test("autorouter honours net classes and clearance matrix for pad-to-trace and trace-to-trace spacing", async () => {
  const runBoard = async (withHighVoltageClearance: boolean) => {
    const circuit = new Circuit()
    circuit.add(
      <board width="30mm" height="20mm" layers={1}>
        <net name="HV_NET" />
        <net name="LV_NET" />
        {withHighVoltageClearance && (
          <>
            <netclass
              name="HV"
              clearance="2mm"
              traceWidth="0.4mm"
              nets={["net.HV_NET"]}
            />
            <netclass
              name="LV"
              clearance="0.15mm"
              traceWidth="0.15mm"
              nets={["net.LV_NET"]}
            />
            <clearancematrix
              matrix={{
                HV: { LV: "2mm", HV: "1.5mm" },
                LV: { LV: "0.15mm" },
              }}
            />
          </>
        )}
        <resistor
          name="R_HV1"
          resistance="10k"
          footprint="0805"
          pcbX={-5}
          pcbY={0}
        />
        <resistor
          name="R_HV2"
          resistance="10k"
          footprint="0805"
          pcbX={5}
          pcbY={0}
        />
        {/* LV resistor at (0, 1.5) sits 0.875mm above y=0: passes 0.15mm default clearance, but forces HV trace to detour downward when 2mm HV-LV clearance is active */}
        <resistor
          name="R_LV1"
          resistance="1k"
          footprint="0805"
          pcbX={0}
          pcbY={1.5}
        />
        <resistor
          name="R_LV2"
          resistance="1k"
          footprint="0805"
          pcbX={0}
          pcbY={5}
        />
        <trace from=".R_HV1 > .pin2" to="net.HV_NET" />
        <trace from=".R_HV2 > .pin1" to="net.HV_NET" />
        <trace from=".R_LV1 > .pin1" to="net.LV_NET" />
        <trace from=".R_LV2 > .pin1" to="net.LV_NET" />
      </board>,
    )
    await circuit.renderUntilSettled()
    return circuit.getCircuitJson()
  }

  const cjWithoutRules = await runBoard(false)
  const cjWithRules = await runBoard(true)

  const tracesWithRules = cjWithRules.filter((el) => el.type === "pcb_trace")
  expect(tracesWithRules.length).toBeGreaterThanOrEqual(2)

  // Verify HV trace width was upgraded to 0.4mm
  const hvTrace = tracesWithRules.find((tr) =>
    tr.route.some(
      (pt) =>
        pt.route_type === "wire" && Math.abs((pt.width ?? 0) - 0.4) < 1e-3,
    ),
  )
  expect(hvTrace).toBeDefined()

  // Verify zero DRC clearance errors on the autorouted board with net-class rules
  const routingDrcChecks = await runAllRoutingChecks(cjWithRules)
  const routingDrcErrors = routingDrcChecks.filter((el) =>
    el.type.endsWith("_error"),
  )
  const placementDrcErrors = await runAllPlacementChecks(cjWithRules)
  expect(routingDrcErrors).toEqual([])
  expect(placementDrcErrors).toEqual([])

  // Verify the without-rules trace would have violated the 2mm HV-LV clearance if checked against the HV/LV rules
  const injectedWithoutRules = [
    ...cjWithoutRules,
    ...cjWithRules.filter(
      (el) =>
        (el as unknown as { type: string }).type === "source_net_class" ||
        (el as unknown as { type: string }).type === "source_clearance_matrix",
    ),
  ]
  const errorsIfUnconstrained = [
    ...checkPadTraceClearance(injectedWithoutRules),
    ...checkEachPcbTraceNonOverlapping(injectedWithoutRules),
  ]
  expect(errorsIfUnconstrained.length).toBeGreaterThan(0)
})

test("DRC catches pad-to-pad clearance violations against net class clearance matrix", async () => {
  const buildPadCircuit = async (hvToLvClearance: string) => {
    const circuit = new Circuit()
    circuit.add(
      <board width="20mm" height="20mm" routingDisabled>
        <net name="HV" />
        <net name="LV" />
        <netclass name="HV_CLASS" clearance="2.5mm" nets={["net.HV"]} />
        <netclass name="LV_CLASS" clearance="0.15mm" nets={["net.LV"]} />
        <clearancematrix
          matrix={{
            HV_CLASS: { LV_CLASS: hvToLvClearance },
            LV_CLASS: { LV_CLASS: "0.15mm" },
          }}
        />
        {/* Two resistors whose pads are ~1.2mm apart vertically (passes 0.15mm, fails 2.5mm) */}
        <resistor
          name="R_HV"
          resistance="10k"
          footprint="0805"
          pcbX={0}
          pcbY={0}
        />
        <resistor
          name="R_LV"
          resistance="1k"
          footprint="0805"
          pcbX={0}
          pcbY={2.2}
        />
        <trace from=".R_HV > .pin1" to="net.HV" />
        <trace from=".R_HV > .pin2" to="net.HV" />
        <trace from=".R_LV > .pin1" to="net.LV" />
        <trace from=".R_LV > .pin2" to="net.LV" />
      </board>,
    )
    await circuit.renderUntilSettled()
    return circuit.getCircuitJson()
  }

  const cjFail = await buildPadCircuit("2.5mm")
  const padErrorsFail = checkPadPadClearance(cjFail)
  expect(padErrorsFail.length).toBeGreaterThan(0)
  expect(padErrorsFail[0].minimum_clearance).toBeCloseTo(2.5, 4)

  // Also verify Board automatically recorded pcb_pad_pad_clearance_error in circuitJson during renderUntilSettled
  const boardRecordedErrors = cjFail.filter(
    (el) => el.type === "pcb_pad_pad_clearance_error",
  )
  expect(boardRecordedErrors.length).toBeGreaterThan(0)

  const cjPass = await buildPadCircuit("0.5mm")
  const padErrorsPass = checkPadPadClearance(cjPass)
  expect(padErrorsPass).toHaveLength(0)
})

test("DRC catches pad-to-trace, trace-to-trace, via-to-pad, via-to-trace, and via-to-via violations for net classes", async () => {
  const circuit = new Circuit()
  const HvClass = useNetClass("HV", {
    clearance: "2.5mm",
    nets: ["net.HV_NET"],
  })
  const LvClass = useNetClass("LV", {
    clearance: "0.15mm",
    nets: ["net.LV_NET"],
  })
  const Matrix = useClearanceMatrix({
    matrix: {
      HV: { LV: "2.5mm", HV: "1.5mm" },
      LV: { LV: "0.15mm" },
    },
  })

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <net name="HV_NET" />
      <net name="LV_NET" />
      <HvClass />
      <LvClass />
      <Matrix />
      <resistor
        name="R_HV"
        resistance="10k"
        footprint="0805"
        pcbX={-5}
        pcbY={0}
      />
      <resistor
        name="R_LV"
        resistance="1k"
        footprint="0805"
        pcbX={5}
        pcbY={0}
      />
      <trace from=".R_HV > .pin1" to="net.HV_NET" />
      <trace from=".R_LV > .pin1" to="net.LV_NET" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const baseCj = circuit.getCircuitJson()
  const hvPad = baseCj.find(
    (
      el,
    ): el is Extract<
      (typeof baseCj)[number],
      { type: "pcb_smtpad"; x: number; y: number }
    > => el.type === "pcb_smtpad" && "x" in el && "y" in el && el.x < 0,
  )!
  const lvPad = baseCj.find(
    (
      el,
    ): el is Extract<
      (typeof baseCj)[number],
      { type: "pcb_smtpad"; x: number; y: number }
    > => el.type === "pcb_smtpad" && "x" in el && "y" in el && el.x > 0,
  )!
  expect(hvPad).toBeDefined()
  expect(lvPad).toBeDefined()

  const hvPortId = hvPad.pcb_port_id!
  const lvPortId = lvPad.pcb_port_id!

  // Inject manual traces & vias on HV and LV nets that are 1.0mm apart (< 2.5mm required, > 0.15mm standard)
  const testCj = [
    ...baseCj.filter((el) => !el.type.endsWith("_error")),
    {
      type: "pcb_trace" as const,
      pcb_trace_id: "pcb_trace_hv",
      source_trace_id: "source_trace_0",
      route: [
        {
          route_type: "wire" as const,
          x: hvPad.x,
          y: hvPad.y,
          width: 0.3,
          layer: "top" as const,
          start_pcb_port_id: hvPortId,
        },
        {
          route_type: "wire" as const,
          x: 0,
          y: 0,
          width: 0.3,
          layer: "top" as const,
        },
      ],
    },
    {
      type: "pcb_trace" as const,
      pcb_trace_id: "pcb_trace_lv",
      source_trace_id: "source_trace_1",
      route: [
        {
          route_type: "wire" as const,
          x: lvPad.x,
          y: lvPad.y,
          width: 0.15,
          layer: "top" as const,
          start_pcb_port_id: lvPortId,
        },
        {
          route_type: "wire" as const,
          x: hvPad.x,
          y: hvPad.y + 1.2,
          width: 0.15,
          layer: "top" as const,
        },
      ],
    },
    {
      type: "pcb_via" as const,
      pcb_via_id: "pcb_via_hv",
      pcb_trace_id: "pcb_trace_hv",
      x: 0,
      y: 0,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top" as const, "bottom" as const],
    },
    {
      type: "pcb_via" as const,
      pcb_via_id: "pcb_via_lv",
      pcb_trace_id: "pcb_trace_lv",
      x: lvPad.x - 1.2,
      y: lvPad.y,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top" as const, "bottom" as const],
    },
    {
      type: "pcb_via" as const,
      pcb_via_id: "pcb_via_hv_near_lv_pad",
      pcb_trace_id: "pcb_trace_hv",
      x: lvPad.x,
      y: lvPad.y + 1.4,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top" as const, "bottom" as const],
    },
  ]

  const padTraceErrors = checkPadTraceClearance(testCj)
  expect(padTraceErrors.length).toBeGreaterThan(0)
  expect(padTraceErrors[0].minimum_clearance).toBeCloseTo(2.5, 4)

  const traceTraceErrors = checkEachPcbTraceNonOverlapping(testCj)
  expect(traceTraceErrors.length).toBeGreaterThan(0)

  const viaPadErrors = checkViaPadClearance(testCj)
  expect(viaPadErrors.length).toBeGreaterThan(0)
  expect(viaPadErrors[0].minimum_clearance).toBeCloseTo(2.5, 4)

  const viaTraceErrors = checkViaTraceClearance(testCj)
  expect(viaTraceErrors.length).toBeGreaterThan(0)
  expect(viaTraceErrors[0].minimum_clearance).toBeCloseTo(2.5, 4)

  // Add a second LV via 1.2mm from pcb_via_hv to test via-to-via spacing
  const testCjWithCloseVias = [
    ...testCj,
    {
      type: "pcb_via" as const,
      pcb_via_id: "pcb_via_lv_close_to_hv_via",
      pcb_trace_id: "pcb_trace_lv",
      x: 1.4,
      y: 0,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top" as const, "bottom" as const],
    },
  ]
  const viaViaErrors = checkDifferentNetViaSpacing(testCjWithCloseVias)
  expect(viaViaErrors.length).toBeGreaterThan(0)
  expect(viaViaErrors[0].minimum_clearance).toBeCloseTo(2.5, 4)

  const allErrors = await runAllChecks(testCjWithCloseVias)
  expect(allErrors.length).toBeGreaterThanOrEqual(5)
})
