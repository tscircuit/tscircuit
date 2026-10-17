import { expect, test } from "bun:test"
import { join } from "node:path"
import packageJson from "../package.json"

test("cli.mjs entrypoint outputs version matching package.json", () => {
  const cliPath = join(import.meta.dirname, "../cli.mjs")
  const result = Bun.spawnSync(["bun", cliPath, "--version"])

  expect(result.exitCode).toBe(0)
  expect(result.stdout.toString().trim()).toBe(packageJson.version)
}, 45_000)

test("cli.mjs entrypoint surfaces CLI help options", () => {
  const cliPath = join(import.meta.dirname, "../cli.mjs")
  const result = Bun.spawnSync(["bun", cliPath, "--help"])

  expect(result.exitCode).toBe(0)
  const output = result.stdout.toString()
  expect(output.toLowerCase()).toContain("tscircuit")
}, 45_000)
