#!/usr/bin/env node

import { createRequire } from "node:module"
import { spawnSync } from "node:child_process"

const require = createRequire(import.meta.url)

// Use require to import package.json
const packageJson = require("./package.json")
global.TSCIRCUIT_VERSION = packageJson.version

function commandExists(cmd) {
  try {
    return spawnSync(cmd, ["--version"], { stdio: "ignore" }).status === 0
  } catch {
    return false
  }
}

// Prefer bun if available (faster), otherwise fall back to tsx.
// This allows `tsci` to work when bun is not installed globally (closes #2828).
const runner = commandExists("bun") ? "bun" : "tsx"

const mainPath = require.resolve("@tscircuit/cli")

const { status } = spawnSync(runner, [mainPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, TSCIRCUIT_VERSION: packageJson.version },
})

process.exit(status ?? 0)
