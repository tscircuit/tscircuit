import { expect, test } from "bun:test"
import { wrap } from "comlink"
import type { CircuitWebWorker } from "@tscircuit/eval/worker"

test("the built worker accepts components serialized by the public worker wrapper", async () => {
  const worker = new Worker(new URL("../dist/webworker.min.js", import.meta.url))
  const remote = wrap<CircuitWebWorker>(worker)
  try {
    await remote.executeComponent({
      __isSerializedReactElement: true,
      type: "board",
      props: {
        width: 10,
        height: 10,
        routingDisabled: true,
        children: {
          __isSerializedReactElement: true,
          type: "pcbnotetext",
          props: { text: "Serialized worker component", pcbX: 0, pcbY: 0 },
        },
      },
    })
    await remote.renderUntilSettled()
    const circuitJson = await remote.getCircuitJson()
    expect(circuitJson).toContainEqual(expect.objectContaining({
      type: "pcb_note_text",
      text: "Serialized worker component",
    }))
  } finally {
    worker.terminate()
  }
})
