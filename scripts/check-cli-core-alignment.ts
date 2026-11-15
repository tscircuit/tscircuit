import { join } from "node:path"
import { validateCliCoreAlignment } from "./cli-core-contract"

const root = join(import.meta.dirname, "..")
const manifest = await Bun.file(join(root, "package.json")).json()
const cli = await Bun.file(
  join(root, "node_modules/@tscircuit/cli/package.json"),
).json()
const core = await Bun.file(
  join(root, "node_modules/@tscircuit/core/package.json"),
).json()
validateCliCoreAlignment(manifest, cli, core)
