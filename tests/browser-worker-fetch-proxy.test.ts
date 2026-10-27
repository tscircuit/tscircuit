import { expect, test } from "bun:test"
import { proxy, wrap } from "comlink"
import type { CircuitWebWorker } from "@tscircuit/eval/worker"

test("the built worker preserves the public fetch proxy protocol and request options", async () => {
  const worker = new Worker(new URL("../dist/webworker.min.js", import.meta.url))
  const remote = wrap<CircuitWebWorker>(worker)
  const requests: { input: string; init: RequestInit }[] = []
  const requestObserved = Promise.withResolvers<void>()
  const responseConsumed = Promise.withResolvers<string>()
  worker.addEventListener("message", (event) => {
    if (event.data?.type !== "worker_fetch") return
    requests.push({ input: event.data.input, init: event.data.init })
    worker.postMessage({
      type: "worker_fetch_result",
      requestId: event.data.requestId,
      success: true,
      response: { body: "Proxied worker response", status: 200, statusText: "OK", headers: {} },
    })
    requestObserved.resolve()
  })
  try {
    await remote.on("debug:logOutput", proxy((event: { message?: string; text: string }) => {
      if (event.message === "fetch_probe_complete") responseConsumed.resolve(event.text)
    }))
    worker.postMessage({ type: "override_global_fetch" })
    await remote.executeWithFsMap({
      mainComponentPath: "board.tsx",
      fsMap: {
        "board.tsx": `
          fetch("./worker-fixture", {
            method: "POST", body: "probe", credentials: "include", cache: "no-store",
            headers: { "X-Worker-Fixture": "yes" }
          }).then(response => response.text()).then(text => {
            globalThis.__tscircuit_circuit.emit("debug:logOutput", { message: "fetch_probe_complete", text });
          });
          export default () => <board width={10} height={10} routingDisabled>
            <pcbnotetext text="Worker fetch proxy request sent" pcbX={0} pcbY={0}/>
          </board>;
        `,
      },
    })
    await requestObserved.promise
    expect(await responseConsumed.promise).toBe("Proxied worker response")
    await remote.renderUntilSettled()
    expect(requests).toEqual([{
      input: "./worker-fixture",
      init: { method: "POST", body: "probe", credentials: "include", cache: "no-store", headers: { "x-worker-fixture": "yes" } },
    }])
    expect(await remote.getCircuitJson()).toContainEqual(expect.objectContaining({
      type: "pcb_note_text",
      text: "Worker fetch proxy request sent",
    }))
  } finally {
    worker.terminate()
  }
})
