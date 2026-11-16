type Manifest = {
  version?: string
  dependencies?: Record<string, string>
  tscircuitDependencySync?: { version: number }
}

export function getCliCoreVersion(cli: Manifest): string | undefined {
  if (!cli.tscircuitDependencySync) return undefined
  if (cli.tscircuitDependencySync.version !== 1) {
    throw new Error("Unsupported CLI dependency synchronization contract")
  }
  const coreVersion = cli.dependencies?.["@tscircuit/core"]
  if (!coreVersion || !/^\d+\.\d+\.\d+$/.test(coreVersion)) {
    throw new Error("CLI must publish an exact stable core version")
  }
  return coreVersion
}

export function getCliCoreDependencyPins(cli: Manifest) {
  const coreVersion = getCliCoreVersion(cli)
  if (!coreVersion) return undefined
  if (!cli.version || !/^\d+\.\d+\.\d+$/.test(cli.version)) {
    throw new Error("CLI must have an exact stable published version")
  }
  return {
    "@tscircuit/cli": cli.version,
    "@tscircuit/core": coreVersion,
  }
}

export function validateCliCoreAlignment(
  current: Manifest,
  cli: Manifest,
  core: Manifest,
) {
  const pins = getCliCoreDependencyPins(cli)
  if (!pins) return
  if (current.dependencies?.["@tscircuit/cli"] !== pins["@tscircuit/cli"]) {
    throw new Error(
      `Pin the installed CLI version ${pins["@tscircuit/cli"]} before copying dependency versions`,
    )
  }
  const expected = pins["@tscircuit/core"]
  if (
    current.dependencies?.["@tscircuit/core"] !== expected ||
    core.version !== expected
  ) {
    throw new Error(
      `Install CLI-selected core ${expected} before copying dependency versions`,
    )
  }
}
