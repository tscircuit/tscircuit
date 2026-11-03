import { expect, test } from "bun:test"
import { Circuit, systemblock } from "../dist"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"

test("the public package lays out system TSX and renders its resolved JSON", async () => {
  const circuit = new Circuit()
  circuit.add(
    <systemblock.page name="overview">
      <systemblock.group name="processing">
        <systemblock.component name="sensor" displayName="Sensor" />
        <systemblock.component name="controller" displayName="Controller" />
      </systemblock.group>
      <systemblock.connection from="sensor" to="controller" label="I2C" direction="both" />
    </systemblock.page>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  const blocks = json.filter((record) => record.type === "system_block_component")
  expect(blocks).toHaveLength(2)
  expect(blocks[1].center.x).toBeGreaterThan(blocks[0].center.x)
  expect(convertCircuitJsonToSystemSvg(json)).toContain("tscircuit-system")
})
