import { execFileSync } from "node:child_process"
import {
  appendFileSync, copyFileSync, lstatSync, mkdtempSync, readFileSync,
  readdirSync, rmSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"

export const budgets = JSON.parse(
  readFileSync(new URL("../bundle-size.config.json", import.meta.url), "utf8"),
)

// Logical file bytes, excluding symlinks (e.g. .bin), without double-counting
// symlink targets or including dev dependencies from the build installation.
export function directoryBytes(directory) {
  let bytes = 0
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) bytes += directoryBytes(path)
    else if (entry.isFile()) bytes += lstatSync(path).size
  }
  return bytes
}

export function measure(root) {
  const temporary = mkdtempSync(join(tmpdir(), "tscircuit-size-"))
  try {
    const browser = readFileSync(join(root, "dist/browser.min.js"))
    const worker = readFileSync(join(root, "dist/webworker.min.js"))
    const [packed] = JSON.parse(execFileSync("npm", [
      "pack", "--json", "--ignore-scripts", "--pack-destination", temporary,
    ], { cwd: root, encoding: "utf8" }))

    // A separate, frozen production install catches runtime dependencies such
    // as tsx/esbuild even when they are external to the generated JS bundles.
    for (const file of ["package.json", "bun.lock"]) {
      copyFileSync(join(root, file), join(temporary, file))
    }
    execFileSync("bun", [
      "install", "--production", "--frozen-lockfile", "--ignore-scripts",
      "--linker=hoisted",
    ], { cwd: temporary, stdio: "inherit" })

    return {
      version: 1,
      metrics: {
        browser: browser.length,
        browserGzip: gzipSync(browser, { level: 9 }).length,
        worker: worker.length,
        workerGzip: gzipSync(worker, { level: 9 }).length,
        package: packed.size,
        packageUnpacked: packed.unpackedSize,
        productionInstall: directoryBytes(join(temporary, "node_modules")),
      },
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

export function readMeasurement(path) {
  // Artifacts from pull requests are untrusted data, including in workflow_run.
  const stat = lstatSync(path)
  if (!stat.isFile() || stat.size > 16384) throw new Error("Invalid size report file")
  const data = JSON.parse(readFileSync(path, "utf8"))
  if (data.version !== 1) throw new Error("Unsupported size report version")
  for (const key of Object.keys(budgets)) {
    if (!Number.isSafeInteger(data.metrics?.[key]) || data.metrics[key] <= 0) {
      throw new Error(`Missing or invalid size metric: ${key}`)
    }
  }
  return data
}

export function compare(base, head) {
  return Object.entries(budgets).map(([key, budget]) => {
    const before = base.metrics[key]
    const after = head.metrics[key]
    const delta = after - before
    const percent = (delta / before) * 100
    return {
      ...budget, before, after, delta, percent,
      exceeded: delta >= budget.maxBytes ||
        (delta >= budget.minBytes && percent >= budget.percent),
    }
  })
}

export function formatBytes(bytes) {
  const magnitude = Math.abs(bytes)
  if (magnitude < 1024) return `${bytes} B`
  if (magnitude < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`
}

export function renderReport(rows) {
  const exceeded = rows.some((row) => row.exceeded)
  return [
    "## Bundle size check",
    "",
    exceeded ? "⚠️ **Large size increase detected. Review before merging.**" :
      "✅ No large size increases detected.",
    "",
    "| Metric | Base | Head | Change | Result |",
    "| --- | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row.label} | ${formatBytes(row.before)} | ${formatBytes(row.after)} | ${row.delta > 0 ? "+" : ""}${formatBytes(row.delta)} (${row.percent > 0 ? "+" : ""}${row.percent.toFixed(2)}%) | ${row.exceeded ? "⚠️ Over budget" : "OK"} |`),
    "",
    "A metric fails when growth reaches **both** its byte and percentage thresholds, " +
      "or its absolute growth cap. See `bundle-size.config.json` for budgets.",
    "",
    "Production install measures logical file bytes from a clean, frozen Bun production install on Linux x64, with lifecycle scripts disabled. " +
      "It includes runtime/peer dependencies and platform binaries, but excludes build dev dependencies.",
    "",
  ].join("\n")
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, first, second] = process.argv.slice(2)
  if (command === "measure" && first && second) {
    writeFileSync(second, JSON.stringify(measure(resolve(first)), null, 2) + "\n")
  } else if (command === "compare" && first && second) {
    const rows = compare(readMeasurement(first), readMeasurement(second))
    const report = renderReport(rows)
    console.log(report)
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)
    }
    if (rows.some((row) => row.exceeded)) process.exitCode = 1
  } else {
    throw new Error("Usage: bundle-size.mjs measure <project> <output.json> | compare <base.json> <head.json>")
  }
}
