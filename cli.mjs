#!/usr/bin/env bun

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// Use require to import package.json
const packageJson = require("./package.json");
global.TSCIRCUIT_VERSION = packageJson.version;

if (process.argv.some((arg) => arg === "--version" || arg === "-v")) {
  console.log(`tscircuit@${packageJson.version}`);
  process.exit(0);
}

async function main() {
  await import("@tscircuit/cli");
}

main();