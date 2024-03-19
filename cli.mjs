#!/usr/bin/env node

global.TSCIRCUIT_VERSION = require("./package.json").version

await import("@tscircuit/cli")