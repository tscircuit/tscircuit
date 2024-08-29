import { $ } from "bun";
import { join } from "path";
// Ensure we're in the project root
$.cwd(join(import.meta.dir, ".."))

// Install the package globally
await $`npm i -g .`;

// Create and navigate to a test project directory
await $`mkdir -p test-project`;

$.cwd(join(import.meta.dir, "../test-project"))

// Run tsci init
const initResult = await $`npx tsci init`;
if (initResult.exitCode !== 0) {
  console.error("tsci init failed");
  process.exit(1);
}

// Run tsci soupify
const soupifyResult = await $`npx tsci soupify --file ./examples/MyCircuit.tsx`;
if (soupifyResult.exitCode !== 0) {
  console.error("tsci soupify failed");
  process.exit(1);
}

console.log("Smoke test completed successfully");