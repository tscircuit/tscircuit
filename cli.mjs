#!/usr/bin/env bun

import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
    dirname(fileURLToPath(import.meta.url)),
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