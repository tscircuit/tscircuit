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

export function validateCliCoreAlignment(
  current: Manifest,
  cli: Manifest,
  core: Manifest,
) {
  const expected = getCliCoreVersion(cli)
  if (!expected) return
  if (
    current.dependencies?.["@tscircuit/core"] !== expected ||
    core.version !== expected
  ) {
    throw new Error(
      `Install CLI-selected core ${expected} before copying dependency versions`,
    )
  }
}
