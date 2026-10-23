import { expect, test } from "bun:test"
import { shouldSkipPackage, DO_NOT_SYNC_PACKAGE } from "../scripts/copy-core-versions"

test("shouldSkipPackage correctly identifies excluded packages and wildcards", () => {
  // Exact matches
  expect(shouldSkipPackage("tsup")).toBe(true)
  expect(shouldSkipPackage("@biomejs/biome")).toBe(true)
  expect(shouldSkipPackage("@jscad/modeling")).toBe(true)
  expect(shouldSkipPackage("react-reconciler")).toBe(true)

  // Wildcard matches (@types/*)
  expect(shouldSkipPackage("@types/node")).toBe(true)
  expect(shouldSkipPackage("@types/react")).toBe(true)
  expect(shouldSkipPackage("@types/bun")).toBe(true)

  // Non-matching regular dependencies that must sync
  expect(shouldSkipPackage("@tscircuit/core")).toBe(false)
  expect(shouldSkipPackage("@tscircuit/props")).toBe(false)
  expect(shouldSkipPackage("circuit-json")).toBe(false)
  expect(shouldSkipPackage("circuit-to-svg")).toBe(false)
})
