import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"

test("the browser package embeds the same selected-engine worker that is published separately", async () => {
  const worker = await readFile(new URL("../dist/webworker.min.js", import.meta.url))
  const browser = await readFile(new URL("../dist/browser.min.js", import.meta.url), "utf8")
  expect(browser.includes(worker.toString("base64"))).toBe(true)
})
