#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function commandExists(cmd) {
  try {
    return spawnSync(cmd, ["--version"], { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
}

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

// Prefer bun: native TypeScript support + import.meta.dir in @tscircuit/cli.
// Fall back to tsx (TypeScript runner on Node), then plain node once
// @tscircuit/cli no longer uses Bun-only APIs.
const runner = commandExists("bun")
  ? "bun"
  : commandExists("tsx")
    ? "tsx"
    : process.execPath;

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRequire = createRequire(join(__dirname, "package.json"));
const cliPkgJsonPath = cliRequire.resolve("@tscircuit/cli/package.json");
const cliMainPath = join(dirname(cliPkgJsonPath), "dist/cli/main.js");

// Expose version for @tscircuit/cli to read via process.env
process.env.TSCIRCUIT_VERSION = packageJson.version;

const { status } = spawnSync(runner, [cliMainPath, ...process.argv.slice(2)], {
  stdio: "inherit",
});

process.exit(status ?? 0);
