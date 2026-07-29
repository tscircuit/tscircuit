import corePackageJson from "@tscircuit/core/package.json"
import { join } from "node:path"

export const DO_NOT_SYNC_PACKAGE = [
  "@biomejs/biome",
  "@tsci/tscircuit.ti",
  "@tscircuit/import-snippet",
  "@tscircuit/layout",
  "@tscircuit/log-soup",
  "@tscircuit/common",
  "@tscircuit/schematic-autolayout",
  "@tscircuit/jlcpcb-manufacturing-specs",
  "@tscircuit/breakout-point-solver",
  "@tscircuit/eecircuit-engine",
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
  "eecircuit-engine",
  "stack-svgs",
]

export type DepMap = Record<string, string>

export type PackageJsonLike = {
  dependencies?: DepMap
  devDependencies?: DepMap
}

export function shouldSkipPackage(packageName: string) {
  return DO_NOT_SYNC_PACKAGE.some((dnsp) =>
    dnsp.endsWith("*")
      ? packageName.startsWith(dnsp.slice(0, -1))
      : packageName === dnsp,
  )
}

export function getDepMaps(pkg: PackageJsonLike): DepMap {
  return {
    ...(pkg.devDependencies ?? {}),
    ...(pkg.dependencies ?? {}),
  }
}

export function applyCoreVersionUpdates(
  currentPackageJson: PackageJsonLike,
  corePackageJson: PackageJsonLike,
) {
  const coreDeps = getDepMaps(corePackageJson)
  const currentDeps = getDepMaps(currentPackageJson)

  const updates: Array<{
    section: "dependencies" | "devDependencies"
    packageName: string
    from: string
    to: string
  }> = []

  for (const section of ["dependencies", "devDependencies"] as const) {
    const sectionDeps = currentPackageJson[section]
    if (!sectionDeps) continue

    for (const [packageName, currentVersion] of Object.entries(sectionDeps)) {
      const coreVersion = coreDeps[packageName]
      if (coreVersion && coreVersion !== currentVersion) {
        updates.push({
          section,
          packageName,
          from: currentVersion,
          to: coreVersion,
        })
        sectionDeps[packageName] = coreVersion
      }
    }
  }

  const missingDeps: string[] = []
  for (const packageName of Object.keys(coreDeps)) {
    if (shouldSkipPackage(packageName)) continue
    if (!(packageName in currentDeps)) {
      missingDeps.push(packageName)
    }
  }

  return { updates, missingDeps, currentPackageJson }
}

/** Legacy regex rewriter — kept for tests to prove silent misses. */
export function legacyRegexUpdatePackageJson(
  packageJsonText: string,
  depsToUpdate: DepMap,
  currentDeps: DepMap,
) {
  let packageJson = packageJsonText
  for (const [packageName, version] of Object.entries(depsToUpdate)) {
    const pattern = `"${packageName}":\\s*"${currentDeps[packageName].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"(,)?`
    packageJson = packageJson.replace(
      new RegExp(pattern),
      `"${packageName}": "${version}"$1`,
    )
  }
  return packageJson
}

if (import.meta.main) {
  const packageJsonPath = join(import.meta.dirname, "../package.json")
  const packageJsonText = await Bun.file(packageJsonPath).text()
  const currentPackageJson = JSON.parse(packageJsonText) as PackageJsonLike

  const { updates, missingDeps } = applyCoreVersionUpdates(
    currentPackageJson,
    corePackageJson as PackageJsonLike,
  )

  if (missingDeps.length > 0) {
    throw new Error(
      `Missing core dependencies in package.json: ${missingDeps.join(", ")}. ` +
        `\n\nAdd them to package.json or add to DO_NOT_SYNC_PACKAGE list.`,
    )
  }

  if (updates.length > 0) {
    for (const update of updates) {
      console.log(
        `Updating ${update.packageName} (${update.section}) from ${update.from} to ${update.to}`,
      )
    }

    // Write via JSON so version updates cannot silently no-op when formatting
    // differs from the previous regex-based rewriter.
    await Bun.write(
      packageJsonPath,
      `${JSON.stringify(currentPackageJson, null, 2)}\n`,
    )
    console.log(`Wrote ${updates.length} dependency update(s) to package.json`)
  } else {
    console.log("All synced dependencies already match @tscircuit/core")
  }
}
