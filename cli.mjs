#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

// Use require to import package.json
const packageJson = require("./package.json");
global.TSCIRCUIT_VERSION = packageJson.version;

function commandExists(cmd) {
  try {
    const res = spawnSync(cmd, ["--version"], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve the @tscircuit/cli entrypoint which handles bun/tsx detection
let cliEntrypoint;
try {
  const cliPkgPath = require.resolve("@tscircuit/cli/package.json");
  const cliRoot = dirname(cliPkgPath);
  cliEntrypoint = join(cliRoot, "dist/cli/main.js");
} catch {
  // Fallback: try resolving the main entrypoint directly
  try {
    cliEntrypoint = require.resolve("@tscircuit/cli");
  } catch {
    console.error(
      "Error: Could not find @tscircuit/cli. Try reinstalling: npm install -g tscircuit",
    );
    process.exit(1);
  }
}

// Prefer bun for performance, fall back to node (dist is compiled for node target)
const runner = commandExists("bun") ? "bun" : "node";

const { status } = spawnSync(runner, [cliEntrypoint, ...process.argv.slice(2)], {
  stdio: "inherit",
});

process.exit(status ?? 0);