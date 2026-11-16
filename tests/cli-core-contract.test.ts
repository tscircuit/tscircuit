import { expect, test } from "bun:test"
import {
  getCliCoreVersion,
  getCliCoreDependencyPins,
  validateCliCoreAlignment,
} from "../scripts/cli-core-contract"

test("aggregate adopts CLI's exact core and rejects drift or unsupported contracts", () => {
  const cli = {
    version: "0.1.100",
    tscircuitDependencySync: { version: 1 },
    dependencies: { "@tscircuit/core": "0.0.123" },
  }
  const dependencies = { ...cli.dependencies, "@tscircuit/cli": cli.version }
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
    validateCliCoreAlignment({ dependencies }, cli, {
      version: "0.0.123",
    }),
  ).not.toThrow()
  expect(() =>
    validateCliCoreAlignment(
      { dependencies: { ...dependencies, "@tscircuit/core": "0.0.124" } },
      cli,
      { version: "0.0.124" },
    ),
  ).toThrow("CLI-selected")
  expect(() =>
    validateCliCoreAlignment({ dependencies }, cli, {
      version: "0.0.124",
    }),
  ).toThrow("CLI-selected")
})

test("the CLI/core pair remains pinned when future CLI releases select a different core", () => {
  const cli = {
    version: "0.1.100",
    tscircuitDependencySync: { version: 1 },
    dependencies: { "@tscircuit/core": "0.0.123" },
  }
  const pins = getCliCoreDependencyPins(cli)!
  expect(pins).toEqual({
    "@tscircuit/cli": "0.1.100",
    "@tscircuit/core": "0.0.123",
  })
  expect(getCliCoreDependencyPins({})).toBeUndefined()
  expect(() => getCliCoreDependencyPins({ ...cli, version: "latest" })).toThrow(
    "exact stable published version",
  )
  expect(() =>
    validateCliCoreAlignment(
      { dependencies: { ...pins, "@tscircuit/cli": "^0.1.100" } },
      cli,
      { version: "0.0.123" },
    ),
  ).toThrow("Pin the installed CLI")
  expect(() =>
    validateCliCoreAlignment(
      { dependencies: pins },
      {
        ...cli,
        version: "0.1.101",
        dependencies: { "@tscircuit/core": "0.0.124" },
      },
      { version: "0.0.123" },
    ),
  ).toThrow("Pin the installed CLI")
})
