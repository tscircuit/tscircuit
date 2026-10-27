import { expect, test } from "bun:test"
import { Circuit } from "../dist"

test("published Circuit uses rectangle-aware connector insertion inference", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width={100} height={80} routingDisabled schDisabled>
      <connector
        name="J_USB0"
        pcbX={16}
        pcbY={27}
        pcbRotation={180}
        pinLabels={{ pin1: "VBUS", pin2: "DM", pin3: "DP", pin4: "GND", pin5: "SHIELD" }}
        footprint={
          <footprint>
            {[0, 2.5, 4.5, 7].map((x, pin) => (
              <platedhole key={pin} portHints={[`pin${pin + 1}`]} pcbX={x - 3.5} pcbY={0} shape="circle" holeDiameter={0.92} outerDiameter={1.6} />
            ))}
            {[-3.07, 10.07].map((x) => (
              <platedhole key={x} portHints={["pin5"]} pcbX={x - 3.5} pcbY={-2.71} shape="circle" holeDiameter={2.3} outerDiameter={3} />
            ))}
            <silkscreenrect pcbY={-5.74} width={12.5} height={13.5} />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  const connector = json.find((element) => element.type === "pcb_component")!
  expect(connector.insertion_direction).toBeUndefined()
  expect(connector.cable_insertion_center?.x).toBeCloseTo(connector.center.x)
  expect(connector.cable_insertion_center?.y).toBeGreaterThan(connector.center.y)
  expect(json.filter((element) => element.type === "pcb_connector_not_in_accessible_orientation_warning")).toHaveLength(0)
})
