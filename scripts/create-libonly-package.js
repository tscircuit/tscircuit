#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export function generateLibonlyPackageJson(originalPackage) {
  if (!originalPackage || typeof originalPackage !== "object") {
    throw new Error("Invalid package.json object provided")
  }

  const libonlyPackage = {
    ...originalPackage,
    version: `${originalPackage.version || "0.0.0"}-libonly`,
    dependencies: {
      ...(originalPackage.dependencies || {}),
    },
    files: Array.isArray(originalPackage.files)
      ? originalPackage.files.filter((file) => file !== "cli.mjs")
      : ["dist", "globals.d.ts"],
  }

  delete libonlyPackage.dependencies["@tscircuit/cli"]
  delete libonlyPackage.bin

  return libonlyPackage
}

// When executed directly as a script
const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const packageJsonPath = join(__dirname, "..", "package.json")

  if (!existsSync(packageJsonPath)) {
    console.error(`package.json not found at ${packageJsonPath}`)
    process.exit(1)
  }

  const originalPackage = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  const libonlyPackage = generateLibonlyPackageJson(originalPackage)

  const libonlyPackageJsonPath = join(__dirname, "..", "package-libonly.json")
  writeFileSync(
    libonlyPackageJsonPath,
    `${JSON.stringify(libonlyPackage, null, 2)}\n`,
  )

  console.log("Created package-libonly.json")
}
