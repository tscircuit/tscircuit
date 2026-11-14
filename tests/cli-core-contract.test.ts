import { expect, test } from "bun:test"
import {
  getCliCoreVersion,
  validateCliCoreAlignment,
} from "../scripts/cli-core-contract"

test("aggregate adopts CLI's exact core and rejects drift or unsupported contracts", () => {
  const cli = {
    tscircuitDependencySync: { version: 1 },
    dependencies: { "@tscircuit/core": "0.0.123" },
  }
  expect(getCliCoreVersion({})).toBeUndefined()
  expect(getCliCoreVersion(cli)).toBe("0.0.123")
  expect(() =>
    getCliCoreVersion({
      ...cli,
      dependencies: { "@tscircuit/core": "^0.0.123" },
    }),
  ).toThrow("exact stable")
  expect(() =>
    getCliCoreVersion({ ...cli, tscircuitDependencySync: { version: 2 } }),
  ).toThrow("Unsupported")
  expect(() =>
    validateCliCoreAlignment({ dependencies: cli.dependencies }, cli, {
      version: "0.0.123",
    }),
  ).not.toThrow()
  expect(() =>
    validateCliCoreAlignment(
      { dependencies: { "@tscircuit/core": "0.0.124" } },
      cli,
      { version: "0.0.124" },
    ),
  ).toThrow("CLI-selected")
  expect(() =>
    validateCliCoreAlignment({ dependencies: cli.dependencies }, cli, {
      version: "0.0.124",
    }),
  ).toThrow("CLI-selected")
})
