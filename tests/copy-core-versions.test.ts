import { expect, test } from "bun:test"
import {
  DO_NOT_SYNC_PACKAGE,
  isPackageExcludedFromSync,
} from "../scripts/copy-core-versions"

test("isPackageExcludedFromSync handles exact matches", () => {
  expect(isPackageExcludedFromSync("@jscad/modeling")).toBe(true)
  expect(isPackageExcludedFromSync("tsup")).toBe(true)
  expect(isPackageExcludedFromSync("@tscircuit/core")).toBe(false)
})

test("isPackageExcludedFromSync handles suffix wildcards", () => {
  expect(isPackageExcludedFromSync("@types/node")).toBe(true)
  expect(isPackageExcludedFromSync("@types/react")).toBe(true)
  expect(isPackageExcludedFromSync("other-types/foo")).toBe(false)
})

test("isPackageExcludedFromSync handles infix wildcards for solver packages", () => {
  expect(isPackageExcludedFromSync("@tscircuit/dogbone-solver")).toBe(true)
  expect(isPackageExcludedFromSync("@tscircuit/via-stitch-solver")).toBe(true)
  expect(isPackageExcludedFromSync("@tscircuit/future-dynamic-solver")).toBe(true)
  expect(isPackageExcludedFromSync("@tscircuit/core")).toBe(false)
  expect(isPackageExcludedFromSync("@other/future-solver")).toBe(false)
})

test("isPackageExcludedFromSync custom patterns", () => {
  const patterns = ["@foo/*-bar", "prefix-*"]
  expect(isPackageExcludedFromSync("@foo/test-bar", patterns)).toBe(true)
  expect(isPackageExcludedFromSync("@foo/bar", patterns)).toBe(false)
  expect(isPackageExcludedFromSync("prefix-123", patterns)).toBe(true)
  expect(isPackageExcludedFromSync("noprefix-123", patterns)).toBe(false)
})
