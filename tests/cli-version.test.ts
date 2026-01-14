import { test, expect } from "bun:test"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const packageJson = require("../package.json") as { version: string }

const cliPath = new URL("../cli.mjs", import.meta.url).pathname

const runCli = (args: string[]) =>
  spawnSync("bun", [cliPath, ...args], { cwd: new URL("..", import.meta.url).pathname })

test("tscircuit --version reports package version", () => {
  const { stdout, status, stderr } = runCli(["--version"])

  expect(status).toBe(0)
  expect(stderr.toString()).toBe("")
  expect(stdout.toString()).toBe(`tscircuit@${packageJson.version}\n`)
})

