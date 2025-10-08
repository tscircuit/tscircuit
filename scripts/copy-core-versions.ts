import corePackageJson from "@tscircuit/core/package.json"
import currentPackageJson from "../package.json"
import { join } from "node:path"

const DO_NOT_SYNC_PACKAGE = [
  "@biomejs/biome",
  "@tscircuit/import-snippet",
  "@tscircuit/layout",
  "@tscircuit/common",
  "@tscircuit/log-soup",
  "@tscircuit/schematic-autolayout",
  "@types/*",
  "tsup",
  "react-reconciler",
  "react-reconciler-18",
  "bun-match-svg",
  "chokidar-cli",
  "pkg-pr-new",
  "howfat",
  "live-server",
  "looks-same",
  "ts-expect",
  "concurrently",
  "nanoid",
]

const coreDeps: any = {
  ...corePackageJson.devDependencies,
  ...corePackageJson.dependencies,
}

const currentDeps: any = {
  ...currentPackageJson.devDependencies,
  ...currentPackageJson.dependencies,
}
const depsToUpdate: any = {}

let modifiedDeps = false
// Update dependencies to match core
for (const [packageName, currentVersion] of Object.entries(currentDeps)) {
  if (packageName in coreDeps && coreDeps[packageName] !== currentVersion) {
    console.log(
      `Updating ${packageName} from ${currentVersion} to ${coreDeps[packageName]}`,
    )
    depsToUpdate[packageName] = coreDeps[packageName as keyof typeof coreDeps]
    modifiedDeps = true
  }
}

// Check for missing core dependencies
const missingDeps: string[] = []
for (const packageName of Object.keys(coreDeps)) {
  if (
    DO_NOT_SYNC_PACKAGE.some((dnsp) =>
      dnsp.includes("*")
        ? packageName.startsWith(dnsp.replace("*", ""))
        : packageName === dnsp,
    )
  ) {
    continue
  }
  if (!(packageName in currentDeps)) {
    missingDeps.push(packageName)
  }
}

if (missingDeps.length > 0) {
  throw new Error(
    `Missing core dependencies in package.json: ${missingDeps.join(", ")}. ` +
      `\n\nAdd them to package.json or add to DO_NOT_SYNC_PACKAGE list.`,
  )
}

if (modifiedDeps) {
  // Use regex to replace the dependencies in the package.json
  const packageJsonPath = join(import.meta.dirname, "../package.json")
  let packageJson = await Bun.file(packageJsonPath).text()
  for (const [packageName, version] of Object.entries(depsToUpdate)) {
    const pattern = `"${packageName}":\\s*"${currentDeps[packageName].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"(,)?`
    packageJson = packageJson.replace(
      new RegExp(pattern),
      `"${packageName}": "${version}"$1`,
    )
  }
  await Bun.write(packageJsonPath, packageJson)
}
