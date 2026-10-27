import { beforeAll, expect, test } from "bun:test"
import { readFile, writeFile } from "node:fs/promises"
import { routeH3WithPackagedWorker, type WorkerRoutingResult } from "./fixtures/browser-worker/run-packaged-worker"
import { renderWorkerH3 } from "./fixtures/browser-worker/render-worker-h3"

let result: WorkerRoutingResult

beforeAll(async () => {
  result = await routeH3WithPackagedWorker()
  expect(result.inputSha256).toBe("5f157c9638526056eefb3e5dda5e262e71f7c9bfd7baf2c4cd09b6418cea4a11")
  expect(result.injectionCount).toBe(1)
  expect(result.originalInput.obstacles).toHaveLength(479)
  const svg = renderWorkerH3(result)
  const snapshot = new URL("./__snapshots__/browser-worker-h3-ddr.snap.svg", import.meta.url)
  if (process.env.BUN_UPDATE_SNAPSHOTS === "1") await writeFile(snapshot, svg)
  expect(svg).toBe(await readFile(snapshot, "utf8"))
})

test.failing("the shipped worker freshly routes all eleven real H3 DDR signals", () => {
  expect(result.error).toBeNull()
  expect(result.outcome).toBe("complete")
  expect(result.output?.traces).toHaveLength(11)
  for (const connection of result.originalInput.connections) {
    const trace = result.output?.traces?.find((candidate) => candidate.connection_name === connection.name)
    expect(trace).toBeDefined()
    for (const terminal of connection.pointsToConnect)
      expect(trace!.route.some((point) => Math.hypot(point.x - terminal.x, point.y - terminal.y) < 1e-6)).toBe(true)
  }
})
