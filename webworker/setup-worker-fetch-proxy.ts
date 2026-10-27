import type { BodyInit } from "bun"

interface FetchProxyResponse {
  type: "worker_fetch_result"
  requestId: number
  success: boolean
  response: { body: BodyInit | null; status: number; statusText: string; headers: ResponseInit["headers"] }
  error: { message: string; name?: string; stack?: string }
}

type WorkerFetchMessage = FetchProxyResponse
  | { type: "override_global_fetch" }
  | { type: "disable_cdn_loading"; value: boolean }

/** Preserve the fetch-proxy protocol used by @tscircuit/eval/worker. */
export function setupWorkerFetchProxy(): void {
  const pendingRequests = new Map<number, PromiseWithResolvers<Response>>()
  let requestCounter = 0
  const fetchProxy = async (input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> => {
    const requestId = ++requestCounter
    const pending = Promise.withResolvers<Response>()
    pendingRequests.set(requestId, pending)
    const requestInit = { ...init }
    let requestUrl: string
    if (input instanceof Request) {
      const request = new Request(input, init)
      requestUrl = request.url
      Object.assign(requestInit, {
        method: request.method,
        headers: Object.fromEntries(request.headers),
        body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      })
    } else {
      requestUrl = input.toString()
      if (init?.headers) requestInit.headers = Object.fromEntries(new Headers(init.headers))
    }
    globalThis.postMessage({ type: "worker_fetch", requestId, input: requestUrl, init: requestInit })
    return pending.promise
  }
  globalThis.addEventListener("message", (event: MessageEvent<WorkerFetchMessage>) => {
    const message = event.data
    if (!message) return
    if (message.type === "override_global_fetch") {
      Object.assign(globalThis, { fetch: fetchProxy })
      return
    }
    if (message.type === "disable_cdn_loading") {
      Object.assign(globalThis, { __DISABLE_CDN_LOADING__: message.value })
      return
    }
    if (message.type !== "worker_fetch_result") return
    const pending = pendingRequests.get(message.requestId)
    if (!pending) return
    pendingRequests.delete(message.requestId)
    if (message.success) {
      pending.resolve(new Response(message.response.body, message.response))
    } else {
      const error = new Error(message.error.message)
      if (message.error.name) error.name = message.error.name
      if (message.error.stack) error.stack = message.error.stack
      pending.reject(error)
    }
  })
}

