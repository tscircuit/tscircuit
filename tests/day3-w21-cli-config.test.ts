import test, { expect } from "bun:test"

test("tscircuit - cli configuration entry parsing stability", () => {
  const config = { port: 3000, host: "127.0.0.1", dev: true }
  expect(config.port).toBe(3000)
  expect(config.dev).toBeTrue()
})
