import { join } from "node:path"
import { getCliCoreVersion } from "./cli-core-contract"

const root = join(import.meta.dirname, "..")
function run(...args: string[]) {
  const result = Bun.spawnSync([process.execPath, ...args], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  })
  if (result.exitCode !== 0)
    throw new Error(`Dependency update failed: bun ${args.join(" ")}`)
}

const current = await Bun.file(join(root, "package.json")).json()
const requested = (process.argv[2] ?? "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean)
for (const name of requested) {
  if (!(name in current.dependencies))
    throw new Error(`Unknown dependency: ${name}`)
}
// Never select core independently, including during daily/manual updates.
const packages = [
  ...new Set([
    ...requested.filter((name) => name !== "@tscircuit/core"),
    "@tscircuit/cli",
    "@tscircuit/eval",
    "@tscircuit/runframe",
  ]),
]
run("update", "--latest", ...packages)
const cli = await Bun.file(
  join(root, "node_modules/@tscircuit/cli/package.json"),
).json()
const coreVersion = getCliCoreVersion(cli)
if (coreVersion) {
  run("add", "--exact", `@tscircuit/core@${coreVersion}`)
} else {
  console.log(
    "Legacy CLI: preserve current core until a CLI with an exact core contract is released",
  )
}
run("run", "copy-core-versions")
