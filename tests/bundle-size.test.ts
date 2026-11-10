import { afterEach, expect, test } from "bun:test"
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  budgets, compare, directoryBytes, readMeasurement, renderReport,
} from "../scripts/bundle-size.mjs"
import { notify } from "../scripts/notify-bundle-size.mjs"

const MiB = 1024 ** 2
const originalCwd = process.cwd()
const temporaryDirectories: string[] = []
const measurement = () => ({
  version: 1,
  metrics: Object.fromEntries(Object.keys(budgets).map((key) => [key, 100 * MiB])),
})

function temporaryDirectory() {
  const path = mkdtempSync(join(tmpdir(), "bundle-size-test-"))
  temporaryDirectories.push(path)
  return path
}

afterEach(() => {
  process.chdir(originalCwd)
  for (const path of temporaryDirectories.splice(0)) {
    rmSync(path, { recursive: true, force: true })
  }
})

test("unchanged sizes and reductions pass", () => {
  const base = measurement()
  expect(compare(base, measurement()).some((row) => row.exceeded)).toBe(false)
  const head = measurement()
  head.metrics.browser /= 2
  expect(compare(base, head).some((row) => row.exceeded)).toBe(false)
  expect(renderReport(compare(base, head))).toContain("No large size increases")
})

test("relative growth needs both a meaningful byte and percentage increase", () => {
  const base = measurement()
  const head = measurement()
  base.metrics.browser = 1024
  head.metrics.browser = 2048
  expect(compare(base, head).find((row) => row.label === "Browser bundle")?.exceeded).toBe(false)
  base.metrics.browser = 10 * MiB
  head.metrics.browser = base.metrics.browser + 100 * 1024
  expect(compare(base, head).find((row) => row.label === "Browser bundle")?.exceeded).toBe(false)
  head.metrics.browser = base.metrics.browser + 512 * 1024
  expect(compare(base, head).find((row) => row.label === "Browser bundle")?.exceeded).toBe(true)
})

test("a tsx/esbuild-sized production addition fails even below five percent", () => {
  const base = measurement()
  const head = measurement()
  base.metrics.productionInstall = 1024 * MiB
  head.metrics.productionInstall = base.metrics.productionInstall + 10 * MiB
  const row = compare(base, head).find((row) => row.label === "Production node_modules")!
  expect(row.percent).toBeLessThan(5)
  expect(row.exceeded).toBe(true)
  expect(renderReport(compare(base, head))).toContain("Over budget")
})

test("each metric triggers at its absolute growth cap", () => {
  for (const [key, budget] of Object.entries(budgets)) {
    const base = measurement()
    const head = measurement()
    head.metrics[key] += budget.maxBytes
    expect(compare(base, head).filter((row) => row.exceeded)).toHaveLength(1)
  }
})

test("directory sizing counts nested files but does not follow symlinks", () => {
  const root = temporaryDirectory()
  mkdirSync(join(root, "nested"))
  writeFileSync(join(root, "file"), "hello")
  writeFileSync(join(root, "nested/other"), "world")
  symlinkSync(root, join(root, "nested/loop"))
  expect(directoryBytes(root)).toBe(10)
})

test("artifact validation rejects missing, non-numeric, and oversized measurements", () => {
  const file = join(temporaryDirectory(), "measurement.json")
  writeFileSync(file, JSON.stringify(measurement()))
  expect(readMeasurement(file)).toEqual(measurement())
  for (const value of [null, -1, 0, "10000", 1.1, Number.MAX_SAFE_INTEGER + 1]) {
    const data = measurement()
    data.metrics.browser = value as number
    writeFileSync(file, JSON.stringify(data))
    expect(() => readMeasurement(file)).toThrow("invalid size metric")
  }
  writeFileSync(file, JSON.stringify({ version: 1, metrics: {} }))
  expect(() => readMeasurement(file)).toThrow("invalid size metric")
  writeFileSync(file, " ".repeat(16385))
  expect(() => readMeasurement(file)).toThrow("Invalid size report file")
})

function notificationFixture({ regression = true } = {}) {
  const root = temporaryDirectory()
  mkdirSync(join(root, "measurements"))
  const base = measurement()
  const head = measurement()
  if (regression) head.metrics.productionInstall += 6 * MiB
  writeFileSync(join(root, "measurements/base.json"), JSON.stringify(base))
  writeFileSync(join(root, "measurements/head.json"), JSON.stringify(head))
  process.chdir(root)
  const calls: { url: string; method: string; body: any; headers: any }[] = []
  const options = {
    repository: "tscircuit/tscircuit",
    slackWebhook: "https://slack.invalid/incoming",
    slackWorkflowWebhook: "https://slack.invalid/workflow",
    event: { workflow_run: {
      id: 123, event: "push", head_branch: "main", head_sha: "abc123",
      conclusion: "failure",
    } },
    request: async (url: string, init: any) => {
      calls.push({ url, method: init.method, body: init.body && JSON.parse(init.body), headers: init.headers })
      return new Response("ok", { status: 200 })
    },
  }
  return { calls, options }
}

test("main regression sends one dedicated Slack alert with the landed commit", async () => {
  const { calls, options } = notificationFixture()
  await notify(options)
  expect(calls).toHaveLength(1)
  expect(calls[0].url).toBe(options.slackWebhook)
  expect(calls[0].body.text).toContain("on main")
  expect(calls[0].body.text).toContain("+6.00 MiB")
  expect(calls[0].body.text).toContain("/commit/abc123")
  expect(calls[0].body.text).toContain("actions/runs/123")
  expect(calls[0].headers.Authorization).toBeUndefined()
})

test("PR runs never notify, even with a size regression", async () => {
  const { calls, options } = notificationFixture()
  options.event.workflow_run.event = "pull_request"
  // The guard must run before even reading PR artifacts.
  rmSync("measurements", { recursive: true })
  await notify(options)
  expect(calls).toHaveLength(0)
})

test("pushes outside main and cancelled runs never notify", async () => {
  for (const change of [{ head_branch: "feature" }, { conclusion: "cancelled" }]) {
    const { calls, options } = notificationFixture()
    Object.assign(options.event.workflow_run, change)
    await notify(options)
    expect(calls).toHaveLength(0)
  }
})

test("unchanged, reduced, and below-budget sizes on main do not notify", async () => {
  for (const delta of [0, -6 * MiB, 1024]) {
    const { calls, options } = notificationFixture({ regression: false })
    const head = measurement()
    head.metrics.productionInstall += delta
    writeFileSync("measurements/head.json", JSON.stringify(head))
    await notify(options)
    expect(calls).toHaveLength(0)
  }
})

test("main regressions reuse the existing MESSAGE workflow webhook", async () => {
  const { calls, options } = notificationFixture()
  options.slackWebhook = ""
  await notify(options)
  expect(calls).toHaveLength(1)
  expect(calls[0].url).toBe(options.slackWorkflowWebhook)
  expect(calls[0].body.MESSAGE).toContain("on main")
  expect(calls[0].body.MESSAGE).toContain("/commit/abc123")
})

test("Slack HTTP failures fail the notification job", async () => {
  const { options } = notificationFixture()
  options.request = async () => new Response("error", { status: 500 })
  await expect(notify(options)).rejects.toThrow("Slack notification failed (500)")
})
