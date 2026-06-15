import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const rootDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1")
const distPath = path.join(rootDir, "..", "dist", "index.d.ts")
const content = await readFile(distPath, "utf8")
const reference = '/// <reference path="../globals.d.ts" />\n'

if (!content.startsWith(reference)) {
  await writeFile(distPath, `${reference}${content}`)
}
