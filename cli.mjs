#!/usr/bin/env node

import { createRequire } from "node:module"
import { spawnSync } from "node:child_process"

const require = createRequire(import.meta.url)

// Use require to import package.json
const packageJson = require("./package.json")
global.TSCIRCUIT_VERSION = packageJson.version

// Delegate to @tscircuit/cli entrypoint which handles bun/tsx runtime detection.
// This allows `tsci` to work when bun is not installed globally.
const entrypointPath = require.resolve("@tscircuit/cli/cli/entrypoint.js")

const { status } = spawnSync(process.execPath, [entrypointPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, TSCIRCUIT_VERSION: packageJson.version },
})

process.exit(status ?? 0)
