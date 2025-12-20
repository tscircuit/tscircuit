import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import { createDebugPortJsx } from "../lib/components/debug-port"

test("debug port jsx generator works", async () => {
  const debugPortJsx = createDebugPortJsx({
    name: "TEST_DEBUG",
    x: 5,
    y: 5,
    pinCount: 10
  })

  expect(debugPortJsx).toBeTruthy()
  expect(typeof debugPortJsx).toBe('string')
  expect(debugPortJsx).toContain('TEST_DEBUG')
  expect(debugPortJsx).toContain('RP2040')
  expect(debugPortJsx).toContain('ADC')
  expect(debugPortJsx).toContain('D1')
  expect(debugPortJsx).toContain('D10')
})
