import { expect, test } from "bun:test"
import { createWorkerBlobUrlExpression } from "../scripts/create-worker-blob-url-expression"

test("worker blob URL expression preserves UTF-8 bytes", async () => {
  const workerJs = "console.log('snowman \u2603')\n"
  const base64Worker = Buffer.from(workerJs, "utf8").toString("base64")
  const expression = createWorkerBlobUrlExpression(base64Worker)
  const blobUrl = eval(expression) as string

  const response = await fetch(blobUrl)
  expect(await response.text()).toBe(workerJs)
})
