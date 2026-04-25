/**
 * Dynamic converter loaders using jsDelivr CDN.
 *
 * These functions lazy-load circuit-json converter packages on demand from
 * jsDelivr CDN, avoiding the need to bundle large converter dependencies into
 * the main tscircuit bundle. Each loader caches its promise so the module is
 * only fetched once per session. Failed loads clear the cache so they can be
 * retried.
 *
 * Usage:
 *   import { loadGerberConverter } from "tscircuit"
 *   const { convertSoupToGerberCommands } = await loadGerberConverter()
 */

function cdnUrl(pkg: string, version: string): string {
  return `https://cdn.jsdelivr.net/npm/${pkg}@${version}/+esm`
}

// ---------------------------------------------------------------------------
// circuit-json-to-gerber
// ---------------------------------------------------------------------------

export interface CircuitJsonToGerberModule {
  convertSoupToGerberCommands: (
    circuitJson: unknown[],
    opts?: { flip_y_axis?: boolean },
  ) => unknown
  stringifyGerberCommandLayers: (layers: unknown) => Record<string, string>
  convertSoupToExcellonDrillCommands: (opts: {
    circuitJson: unknown[]
    is_plated?: boolean
    flip_y_axis?: boolean
  }) => unknown
  stringifyExcellonDrill: (cmds: unknown) => string
}

let gerberPromise: Promise<CircuitJsonToGerberModule> | null = null

export const loadGerberConverter =
  async (): Promise<CircuitJsonToGerberModule> => {
    if (!gerberPromise) {
      gerberPromise = import(
        /* @vite-ignore */ cdnUrl("circuit-json-to-gerber", "0.0.49")
      ).catch((err: unknown) => {
        gerberPromise = null
        throw err
      }) as Promise<CircuitJsonToGerberModule>
    }
    return gerberPromise
  }

// ---------------------------------------------------------------------------
// circuit-json-to-bom-csv
// ---------------------------------------------------------------------------

export interface CircuitJsonToBomCsvModule {
  convertCircuitJsonToBomRows: (opts: {
    circuitJson: unknown[]
  }) => Promise<unknown[]>
  convertBomRowsToCsv: (rows: unknown[]) => Promise<string>
}

let bomCsvPromise: Promise<CircuitJsonToBomCsvModule> | null = null

export const loadBomCsvConverter =
  async (): Promise<CircuitJsonToBomCsvModule> => {
    if (!bomCsvPromise) {
      bomCsvPromise = import(
        /* @vite-ignore */ cdnUrl("circuit-json-to-bom-csv", "0.0.9")
      ).catch((err: unknown) => {
        bomCsvPromise = null
        throw err
      }) as Promise<CircuitJsonToBomCsvModule>
    }
    return bomCsvPromise
  }

// ---------------------------------------------------------------------------
// circuit-json-to-pnp-csv
// ---------------------------------------------------------------------------

export interface CircuitJsonToPnpCsvModule {
  convertCircuitJsonToPickAndPlaceCsv: (
    circuitJson: unknown[],
  ) => Promise<string>
}

let pnpCsvPromise: Promise<CircuitJsonToPnpCsvModule> | null = null

export const loadPnpCsvConverter =
  async (): Promise<CircuitJsonToPnpCsvModule> => {
    if (!pnpCsvPromise) {
      pnpCsvPromise = import(
        /* @vite-ignore */ cdnUrl("circuit-json-to-pnp-csv", "0.0.7")
      ).catch((err: unknown) => {
        pnpCsvPromise = null
        throw err
      }) as Promise<CircuitJsonToPnpCsvModule>
    }
    return pnpCsvPromise
  }

// ---------------------------------------------------------------------------
// circuit-json-to-kicad
// ---------------------------------------------------------------------------

export interface KicadConverterInstance {
  runUntilFinished(): void
  getOutputString(): string
}

export interface KicadLibraryConverterInstance {
  runUntilFinished(): void
  getOutput(): {
    kicadSymString: string
    footprints: Array<{
      footprintName: string
      kicadModString: string
    }>
    model3dSourcePaths: string[]
    fpLibTableString: string
    symLibTableString: string
  }
}

export interface CircuitJsonToKicadModule {
  CircuitJsonToKicadPcbConverter: new (
    circuitJson: unknown,
  ) => KicadConverterInstance
  CircuitJsonToKicadSchConverter: new (
    circuitJson: unknown,
  ) => KicadConverterInstance
  CircuitJsonToKicadProConverter: new (
    circuitJson: unknown,
    opts: {
      projectName: string
      schematicFilename: string
      pcbFilename: string
    },
  ) => KicadConverterInstance
  CircuitJsonToKicadLibraryConverter: new (
    circuitJson: unknown,
    opts: { libraryName: string; footprintLibraryName: string },
  ) => KicadLibraryConverterInstance
}

let kicadPromise: Promise<CircuitJsonToKicadModule> | null = null

export const loadKicadConverter =
  async (): Promise<CircuitJsonToKicadModule> => {
    if (!kicadPromise) {
      kicadPromise = import(
        /* @vite-ignore */ cdnUrl("circuit-json-to-kicad", "0.0.120")
      ).catch((err: unknown) => {
        kicadPromise = null
        throw err
      }) as Promise<CircuitJsonToKicadModule>
    }
    return kicadPromise
  }

// ---------------------------------------------------------------------------
// circuit-json-to-gltf
// ---------------------------------------------------------------------------

export interface CircuitJsonToGltfModule {
  convertCircuitJsonToGltf: (
    circuitJson: unknown[],
    opts?: { format?: "glb" | "gltf"; boardTextureResolution?: number },
  ) => Promise<ArrayBuffer | unknown>
}

let gltfPromise: Promise<CircuitJsonToGltfModule> | null = null

export const loadGltfConverter = async (): Promise<CircuitJsonToGltfModule> => {
  if (!gltfPromise) {
    gltfPromise = import(
      /* @vite-ignore */ cdnUrl("circuit-json-to-gltf", "0.0.96")
    ).catch((err: unknown) => {
      gltfPromise = null
      throw err
    }) as Promise<CircuitJsonToGltfModule>
  }
  return gltfPromise
}

// ---------------------------------------------------------------------------
// circuit-json-to-step
// ---------------------------------------------------------------------------

export interface CircuitJsonToStepModule {
  circuitJsonToStep: (
    circuitJson: unknown[],
    opts: {
      boardWidth: number
      boardHeight: number
      boardThickness: number
      productName?: string
      includeComponents?: boolean
      includeExternalMeshes?: boolean
    },
  ) => Promise<string>
}

let stepPromise: Promise<CircuitJsonToStepModule> | null = null

export const loadStepConverter = async (): Promise<CircuitJsonToStepModule> => {
  if (!stepPromise) {
    stepPromise = import(
      /* @vite-ignore */ cdnUrl("circuit-json-to-step", "0.0.26")
    ).catch((err: unknown) => {
      stepPromise = null
      throw err
    }) as Promise<CircuitJsonToStepModule>
  }
  return stepPromise
}

// ---------------------------------------------------------------------------
// circuit-json-to-lbrn
// ---------------------------------------------------------------------------

export interface LbrnProject {
  toXml: () => string
}

export interface CircuitJsonToLbrnModule {
  convertCircuitJsonToLbrn: (
    circuitJson: unknown[],
    opts?: { includeSilkscreen?: boolean },
  ) => Promise<LbrnProject>
}

let lbrnPromise: Promise<CircuitJsonToLbrnModule> | null = null

export const loadLbrnConverter = async (): Promise<CircuitJsonToLbrnModule> => {
  if (!lbrnPromise) {
    lbrnPromise = import(
      /* @vite-ignore */ cdnUrl("circuit-json-to-lbrn", "0.0.71")
    ).catch((err: unknown) => {
      lbrnPromise = null
      throw err
    }) as Promise<CircuitJsonToLbrnModule>
  }
  return lbrnPromise
}

// ---------------------------------------------------------------------------
// circuit-json-to-spice
// ---------------------------------------------------------------------------

export interface CircuitJsonToSpiceModule {
  circuitJsonToSpice?: (circuitJson: unknown[]) => string
  default?: (circuitJson: unknown[]) => string
}

let spicePromise: Promise<CircuitJsonToSpiceModule> | null = null

export const loadSpiceConverter =
  async (): Promise<CircuitJsonToSpiceModule> => {
    if (!spicePromise) {
      spicePromise = import(
        /* @vite-ignore */ cdnUrl("circuit-json-to-spice", "0.0.34")
      ).catch((err: unknown) => {
        spicePromise = null
        throw err
      }) as Promise<CircuitJsonToSpiceModule>
    }
    return spicePromise
  }
