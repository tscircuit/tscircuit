import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

// Match tsup-node: esbuild's service runs under Node, including Bun releases
// whose child-process implementation cannot run the installed esbuild version.
execFileSync("node", [fileURLToPath(new URL("./build-eval-webworker.mjs", import.meta.url))], {
  stdio: "inherit",
})
