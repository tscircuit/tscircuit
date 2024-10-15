#!/usr/bin/env bun

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// Use require to import package.json
const packageJson = require("./package.json");
global.TSCIRCUIT_VERSION = packageJson.version;

async function main() {
  await import("@tscircuit/cli");
}

main();