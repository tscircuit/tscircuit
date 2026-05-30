#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);

// Use require to import package.json
const packageJson = require("./package.json");
global.TSCIRCUIT_VERSION = packageJson.version;

function commandExists(cmd) {
  try {
    return spawnSync(cmd, ["--version"], { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
}

const packageRoot = dirname(fileURLToPath(import.meta.url));
const cliBootstrapPath = join(packageRoot, "cli-bootstrap.mjs");
const localTsxCli = join(packageRoot, "node_modules", "tsx", "dist", "cli.mjs");

const hasBun = commandExists("bun");
const hasLocalTsx = existsSync(localTsxCli);
const runner = hasBun ? "bun" : hasLocalTsx ? process.execPath : "tsx";
const runnerArgs = hasBun || !hasLocalTsx ? [] : [localTsxCli];

const { status } = spawnSync(runner, [...runnerArgs, cliBootstrapPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    TSCIRCUIT_VERSION: packageJson.version,
  },
});

process.exit(status ?? 0);
