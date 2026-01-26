import { test, expect } from "bun:test"
import { kicadModPlugin, registerKicadModPlugin } from "../plugins/bun-plugin-kicad-mod"

test("kicadModPlugin has correct name", () => {
  expect(kicadModPlugin.name).toBe("kicad-mod-loader")
})

test("kicadModPlugin has setup function", () => {
  expect(typeof kicadModPlugin.setup).toBe("function")
})

test("registerKicadModPlugin is a function", () => {
  expect(typeof registerKicadModPlugin).toBe("function")
})
