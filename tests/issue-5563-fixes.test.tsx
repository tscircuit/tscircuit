import { describe, expect, test } from "bun:test"
import {
  Circuit,
  checkViaPadClearance,
  runAllRoutingChecks,
} from "../index"
import { runAllPlacementChecks } from "@tscircuit/checks"

describe("Issue #5563 fixes", () => {
  test("1. routingDisabled is honoured when an async effect re-renders the board", async () => {
    const delay = () => new Promise((r) => setTimeout(r, 20))
    const circuit = new Circuit({
      platform: {
        partsEngine: {
          findPart: async () => {
            await delay()
            return { jlcpcb: ["C25804"] }
          },
          fetchPartCircuitJson: async () => {
            await delay()
            return []
          },
        } as any,
      },
    })

    let started = 0
    circuit.on("autorouting:start", () => {
      started++
    })

    circuit.add(
      <board width="20mm" height="10mm" routingDisabled>
        <chip
          name="U1"
          footprint="soic8"
          manufacturerPartNumber="NE555"
          supplierPartNumbers={{ jlcpcb: ["C46749"] }}
          pinAttributes={{ pin8: { requiresPower: true } }}
          pcbX={-4}
          pcbY={0}
        />
        <resistor name="R2" resistance="1k" footprint="0603" pcbX={4} pcbY={0} />
        <trace from=".U1 > .pin1" to=".R2 > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const pcbTraces = json.filter((el) => el.type === "pcb_trace")

    expect(started).toBe(0)
    expect(pcbTraces).toHaveLength(0)
  })

  test("2a. bounded pcbPack group respects fixed parts outside the group at (0, 0) and (10, -5)", async () => {
    for (const offset of [
      { x: 0, y: 0 },
      { x: 10, y: -5 },
    ]) {
      const circuit = new Circuit({
        platform: { partsEngineDisabled: true },
      })

      circuit.add(
        <board width="60mm" height="40mm" routingDisabled>
          <chip name="U1" footprint="soic8" pcbX={offset.x} pcbY={offset.y} />
          <group
            name="G"
            pcbPack
            pcbX={offset.x}
            pcbY={offset.y}
            width="30mm"
            height="14mm"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <resistor
                key={i}
                name={`R${i}`}
                resistance="1k"
                footprint="0603"
              />
            ))}
          </group>
        </board>,
      )

      await circuit.renderUntilSettled()
      const json = circuit.getCircuitJson()
      const placementErrors = await runAllPlacementChecks(json)

      expect(placementErrors).toHaveLength(0)
    }
  })

  test("2b. bounded pcbPack group fits 10 0603s in 18x8mm without stacking at group centre", async () => {
    const circuit = new Circuit({
      platform: { partsEngineDisabled: true },
    })

    circuit.add(
      <board width="60mm" height="40mm" routingDisabled>
        <group name="G" pcbPack pcbX={0} pcbY={0} width="18mm" height="8mm">
          {Array.from({ length: 10 }, (_, i) => (
            <resistor
              key={i}
              name={`R${i + 1}`}
              resistance="1k"
              footprint="0603"
            />
          ))}
        </group>
      </board>,
    )

    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const packingErrors = json.filter((el) => el.type === "pcb_packing_error")
    const pcbComponents = json.filter((el) => el.type === "pcb_component")
    const placementErrors = await runAllPlacementChecks(json)

    expect(packingErrors).toHaveLength(0)
    expect(pcbComponents).toHaveLength(10)
    expect(placementErrors).toHaveLength(0)

    // Ensure no two resistors share the same center and all lie within the 18x8mm bounds
    const centers = new Set(
      pcbComponents.map(
        (c: any) => `${c.center.x.toFixed(2)},${c.center.y.toFixed(2)}`,
      ),
    )
    expect(centers.size).toBe(10)
    for (const comp of pcbComponents as any[]) {
      expect(comp.center.x - comp.width / 2).toBeGreaterThanOrEqual(-9 - 1e-3)
      expect(comp.center.x + comp.width / 2).toBeLessThanOrEqual(9 + 1e-3)
      expect(comp.center.y - comp.height / 2).toBeGreaterThanOrEqual(-4 - 1e-3)
      expect(comp.center.y + comp.height / 2).toBeLessThanOrEqual(4 + 1e-3)
    }
  })

  test("3. outlined board sets pcb_board.center, width, and height to match the outline bounding box", async () => {
    const outline = [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 30, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ]
    const circuit = new Circuit({
      platform: { partsEngineDisabled: true },
    })

    circuit.add(
      <board outline={outline} routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={25} pcbY={5} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={17} />
        <resistor name="R3" resistance="1k" footprint="0402" pcbX={-5} pcbY={5} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbX={20} pcbY={15} />
      </board>,
    )

    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const pcbBoard = json.find((el) => el.type === "pcb_board") as any

    expect(pcbBoard).toBeDefined()
    expect(pcbBoard.width).toBe(30)
    expect(pcbBoard.height).toBe(20)
    expect(pcbBoard.center).toEqual({ x: 15, y: 10 })
  })

  test("4. checkViaPadClearance enforces min_via_edge_to_pad_edge_clearance before min_pad_edge_to_pad_edge_clearance", async () => {
    // At pcbX=1.675, via edge (outerDiameter=0.6 => radius=0.3, left edge=1.375)
    // is 0.15mm from 0603 R1.pin2 right edge (x = 0.8 + 0.85/2 = 1.225).
    // With minViaEdgeToPadEdgeClearance=0.2 and minPadEdgeToPadEdgeClearance=0.1,
    // 0.15mm < 0.2mm must be reported with minimum: 0.2mm!
    const circuit = new Circuit({
      platform: { partsEngineDisabled: true },
    })

    circuit.add(
      <board
        width="20mm"
        height="10mm"
        routingDisabled
        minViaEdgeToPadEdgeClearance={0.2}
        minPadEdgeToPadEdgeClearance={0.1}
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          pcbX={0}
          pcbY={0}
          connections={{ pin2: "net.A" }}
        />
        <via
          pcbX={1.675}
          pcbY={0}
          holeDiameter="0.3mm"
          outerDiameter="0.6mm"
          fromLayer="top"
          toLayer="bottom"
          connectsTo="net.B"
        />
      </board>,
    )

    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()

    const viaPadErrors = checkViaPadClearance(json)
    expect(viaPadErrors).toHaveLength(1)
    expect(viaPadErrors[0].minimum_clearance).toBeCloseTo(0.2, 5)
    expect(viaPadErrors[0].actual_clearance).toBeCloseTo(0.15, 3)
    expect(viaPadErrors[0].message).toContain("minimum: 0.2mm")

    const routingErrors = await runAllRoutingChecks(json)
    const routingViaPadErr = routingErrors.find(
      (e: any) =>
        e.type === "pcb_pad_pad_clearance_error" &&
        e.pcb_pad_pad_clearance_error_id?.startsWith("via_pad_clearance_"),
    ) as any
    expect(routingViaPadErr).toBeDefined()
    expect(routingViaPadErr.minimum_clearance).toBeCloseTo(0.2, 5)
  })
})
