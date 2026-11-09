#!/usr/bin/env node

// The CLI runs on Bun. The shebang is `node` only so that a machine without
// Bun gets an explanation instead of "env: bun: No such file or directory":
// under Node this file does nothing except hand off to Bun.

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const launcherPath = fileURLToPath(import.meta.url);

const BUN_REQUIRED_MESSAGE = `
Bun is required to use tscircuit, but "bun" was not found on your PATH.

Install Bun globally with one of:

  npm install -g bun
  curl -fsSL https://bun.sh/install | bash               (macOS / Linux)
  powershell -c "irm bun.sh/install.ps1 | iex"           (Windows)

Then run your command again. More info: https://bun.sh/docs/installation
`;

function runWithBun() {
  const child = spawn("bun", [launcherPath, ...process.argv.slice(2)], {
    stdio: "inherit",
  });

  // Forward termination to Bun so it is never left running without us.
  const forwardedSignals = ["SIGINT", "SIGTERM", "SIGHUP"];
  const forwarders = forwardedSignals.map((signal) => {
    const forward = () => child.kill(signal);
    process.on(signal, forward);
    return [signal, forward];
  });

  child.on("error", (error) => {
    if (error.code === "ENOENT") {
      console.error(BUN_REQUIRED_MESSAGE);
    } else {
      console.error(`Unable to start Bun: ${error.message}`);
    }
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      for (const [name, forward] of forwarders) process.off(name, forward);
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

async function runCli() {
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

  await import("@tscircuit/cli");
}

if (process.versions.bun) {
  runCli();
} else {
  runWithBun();
}
