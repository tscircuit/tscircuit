import React from "react"
import test from "ava"
import { createProjectBuilder, createRoot } from "../dist"

test("smoke test for soup", async (t) => {
  const pb = createProjectBuilder()
  const result = await createRoot().render(
    <resistor name="R1" resistance="10kohm" />,
    pb
  )
  t.truthy(result.some((e) => e.type === "schematic_component"))
})
