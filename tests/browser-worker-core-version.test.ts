import { expect, test } from "bun:test"
import corePackage from "@tscircuit/core/package.json"
import { getPackagedWorkerVersion } from "./fixtures/browser-worker/run-packaged-worker"

const selectedCoreVersion = corePackage.version
if (!selectedCoreVersion) throw new Error("Selected Core has no release version")

test("the shipped browser worker evaluates circuits with the selected Core release", async () => {
  expect(await getPackagedWorkerVersion()).toBe(selectedCoreVersion)
})
