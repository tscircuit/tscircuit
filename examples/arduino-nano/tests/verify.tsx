import React from "react"
import { Circuit } from "@tscircuit/core"
import { ArduinoNanoV3 } from "../ArduinoNanoV3"

async function runTest() {
  console.log("🔧 Rendering Arduino Nano V3...\n")
  const circuit = new Circuit()
  circuit.add(<ArduinoNanoV3 />)
  circuit.render()

  const json = circuit.getCircuitJson()

  // Check components
  const components = json.filter((el: any) => el.type === "source_component")
  console.log(`✅ Components: ${components.length} (expected ≥ 20)`)
  if (components.length < 20) throw new Error(`Only ${components.length} components found, expected ≥ 20`)

  // Check board dimensions
  const board = json.find((el: any) => el.type === "pcb_board") as any
  if (!board) throw new Error("No pcb_board found in circuit JSON")
  console.log(`✅ Board: ${board.width}mm × ${board.height}mm (expected 18mm × 45mm)`)
  if (board.width !== 18 || board.height !== 45) throw new Error("Invalid board dimensions")

  // Check traces
  const traces = json.filter((el: any) => el.type === "source_trace")
  console.log(`✅ Traces: ${traces.length} (expected ≥ 30)`)
  if (traces.length < 30) throw new Error(`Only ${traces.length} traces found, expected ≥ 30`)

  // List component names
  console.log("\n📋 Component List:")
  components.forEach((c: any) => {
    console.log(`   - ${c.name} (${c.ftype || "chip"})`)
  })

  console.log("\n🎉 All checks passed! The Arduino Nano V3 circuit is valid.")
}

runTest().catch(err => {
  console.error("\n❌ Test failed:", err.message)
  process.exit(1)
})
