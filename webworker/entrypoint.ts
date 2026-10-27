import { CircuitRunner } from "@tscircuit/eval/eval"
import { expose } from "comlink"
import * as React from "react"
import { deserializeWorkerElement } from "./deserialize-worker-element"
import { setupWorkerFetchProxy } from "./setup-worker-fetch-proxy"

class BrowserCircuitRunner extends CircuitRunner {
  override async executeComponent(component: unknown, opts: { name?: string } = {}): Promise<void> {
    await super.executeComponent(deserializeWorkerElement(component), opts)
  }
}

Object.assign(globalThis, { React, global: globalThis })
setupWorkerFetchProxy()
expose(new BrowserCircuitRunner())
