import { proxy, wrap } from "comlink"
import type { CircuitWebWorker } from "@tscircuit/eval/worker"
import type { SimpleRouteJson } from "@tscircuit/core"
import { readFile } from "node:fs/promises"
import { gunzipSync } from "node:zlib"
import { createHash } from "node:crypto"

export interface WorkerRoutingResult {
  outcome: "complete" | "failed"
  error: string | null
  originalInput: SimpleRouteJson
  inputSha256: string
  injectionCount: number
  output: SimpleRouteJson | null
}

export async function getPackagedWorkerVersion(): Promise<string> {
  const worker = new Worker(new URL("../../../dist/webworker.min.js", import.meta.url))
  const remote = wrap<CircuitWebWorker>(worker)
  try {
    await remote.executeWithFsMap({
      mainComponentPath: "board.tsx",
      fsMap: {
        "board.tsx": `import { Circuit } from "@tscircuit/core";
          export default () => <board width={10} height={10} routingDisabled>
            <pcbnotetext text={new Circuit().getCoreVersion()} pcbX={0} pcbY={0}/>
          </board>;`,
      },
    })
    await remote.renderUntilSettled()
    const circuitJson = await remote.getCircuitJson()
    const versionNote = circuitJson.find((element) => element.type === "pcb_note_text")
    if (versionNote?.type !== "pcb_note_text") throw new Error("Worker did not render the version probe")
    return versionNote.text
  } finally {
    worker.terminate()
  }
}

export async function routeH3WithPackagedWorker(): Promise<WorkerRoutingResult> {
  const rawInput = gunzipSync(await readFile(new URL("h3-byte0.srj.json.gz", import.meta.url)))
  const originalInput: SimpleRouteJson = JSON.parse(rawInput.toString())
  const inputSha256 = createHash("sha256").update(rawInput).digest("hex")
  const worker = new Worker(new URL("../../../dist/webworker.min.js", import.meta.url))
  const remote = wrap<CircuitWebWorker>(worker)
  let injectionCount = 0
  const outcome = Promise.withResolvers<Pick<WorkerRoutingResult, "outcome" | "error" | "output">>()
  try {
    await remote.on("debug:logOutput", proxy((event: { message?: string; count?: number }) => {
      if (event.message === "frozen_h3_input") injectionCount = event.count ?? 0
    }))
    await remote.on("autorouting:end", proxy((event: { simpleRouteJson: SimpleRouteJson }) => {
      outcome.resolve({ outcome: "complete", error: null, output: event.simpleRouteJson })
    }))
    await remote.on("autorouting:error", proxy((event: { error: { message: string } }) => {
      outcome.resolve({ outcome: "failed", error: event.error.message, output: null })
    }))
    await remote.executeWithFsMap({
      mainComponentPath: "board.tsx",
      fsMap: { "board.tsx": getH3WorkerSource(rawInput.toString()) },
    })
    void remote.renderUntilSettled().catch((error: Error) => {
      outcome.reject(error)
    })
    return { ...await outcome.promise, originalInput, inputSha256, injectionCount }
  } finally {
    worker.terminate()
  }
}

function getH3WorkerSource(inputJson: string): string {
  return `
    const originalInput = ${inputJson};
    const h3Circuit = globalThis.__tscircuit_circuit;
    h3Circuit.schematicDisabled = true;
    let injectionCount = 0;
    h3Circuit.on("solver:started", (event) => {
      if (event.solverName !== "BusLanesPipelineSolver") return;
      if (++injectionCount !== 1 || event.solverConstructorArgs[0] !== event.solverParams)
        throw new Error("Expected one synchronous native solver construction");
      for (const key of Object.keys(event.solverParams)) delete event.solverParams[key];
      Object.assign(event.solverParams, structuredClone(originalInput));
      if (JSON.stringify(event.solverParams) !== JSON.stringify(originalInput))
        throw new Error("The original H3 routing input changed");
      h3Circuit.emit("debug:logOutput", { message: "frozen_h3_input", count: injectionCount });
    });
    export default () => <board width={10} height={10} routeRemaining={false} schematicDisabled>
      <autoroutingphase autorouter="bus_lanes" phaseIndex={0}/>
      <chip name="SEED_A" pcbX={-2} pinLabels={{pin1:"DATA"}}>
        <footprint><smtpad shape="circle" radius={0.2} portHints={["pin1"]}/></footprint>
      </chip>
      <chip name="SEED_B" pcbX={2} pinLabels={{pin1:"DATA"}}>
        <footprint><smtpad shape="circle" radius={0.2} portHints={["pin1"]}/></footprint>
      </chip>
      <trace from=".SEED_A > .pin1" to=".SEED_B > .pin1" routingPhaseIndex={0}/>
    </board>;
  `
}
