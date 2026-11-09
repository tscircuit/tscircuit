#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const launcherPath = fileURLToPath(import.meta.url);

if (!process.versions.bun) {
  const { error, signal, status } = spawnSync(
    "bun",
    [launcherPath, ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  if (!error) {
    if (signal) process.kill(process.pid, signal);
    process.exit(status ?? 1);
  }
  if (error.code !== "ENOENT") throw error;

  // The CLI imports user circuits directly, including .circuit.tsx files.
  const { register } = await import("tsx/esm/api");
  register();
}

const require = createRequire(import.meta.url);

// Use require to import package.json
const packageJson = require("./package.json");
global.TSCIRCUIT_VERSION = packageJson.version;

// Expose the runframe + eval bundle shipped by this tscircuit version (the one
// that provides the `tsci` binary) so `tsci dev` can use it when the project has
// no local tscircuit installed. The CLI prefers a project-local tscircuit over
// this, and an explicit RUNFRAME_STANDALONE_FILE_PATH over both.
if (!process.env.TSCIRCUIT_GLOBAL_STANDALONE_FILE_PATH) {
  const browserBundlePath = join(
    dirname(launcherPath),
    "dist",
    "browser.min.js",
  );
  if (existsSync(browserBundlePath)) {
    process.env.TSCIRCUIT_GLOBAL_STANDALONE_FILE_PATH = browserBundlePath;
  }
}

async function main() {
  await import("@tscircuit/cli");
}

main();
