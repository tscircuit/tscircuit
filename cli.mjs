#!/usr/bin/env node
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

// Emits node warning which is annoying
// import packageJson from "./package.json" with { type: "json" }

global.TSCIRCUIT_VERSION = require("./package.json").version

await import("@tscircuit/cli")