import { expect, test } from "bun:test"
import { injectWebWorkerBlobUrl } from "../scripts/copy-runframe-standalone"

test("injectWebWorkerBlobUrl replaces placeholder with base64 data blob expression", () => {
  const dummyStandalone =
    'console.log("init"); const workerUrl = "<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->";'
  const dummyWorker = 'console.log("worker code");'

  const result = injectWebWorkerBlobUrl(dummyStandalone, dummyWorker)

  expect(result).not.toContain(
    "<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->",
  )
  expect(result).toContain("URL.createObjectURL(new Blob([atob(")
  expect(result).toContain(Buffer.from(dummyWorker).toString("base64"))
})
