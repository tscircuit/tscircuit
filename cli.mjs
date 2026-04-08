#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

function commandExists(cmd) {
  try {
    const res = spawnSync(cmd, ["--version"], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
}

const require = createRequire(import.meta.url);

// Resolve the CLI main module from @tscircuit/cli
const cliMainPath = require.resolve("@tscircuit/cli");

// Use bun if available (native .ts support), otherwise fall back to tsx.
// This matches the fallback logic in @tscircuit/cli's own entrypoint.js.
const runner = commandExists("bun") ? "bun" : commandExists("tsx") ? "tsx" : null;

if (!runner) {
  console.error(
    "tscircuit requires bun or tsx to run. Install one of them:\n" +
    "  npm install -g bun\n" +
    "  npm install -g tsx"
  );
  process.exit(1);
}

const { status } = spawnSync(
  runner,
  [cliMainPath, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

process.exit(status ?? 0);
