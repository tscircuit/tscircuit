/**
 * Dynamic Converter Loader
 * Loads circuit converters on-the-fly from jsDelivr CDN instead of bundling them
 */

const CDN_BASE = "https://cdn.jsdelivr.net/npm"
const CONVERTER_CACHE = new Map<string, any>()

/**
 * Available converters that can be dynamically loaded
 */
export const AVAILABLE_CONVERTERS = {
  "circuit-json-to-gerber": {
    package: "circuit-json-to-gerber",
    version: "latest",
    export: "default",
  },
  "circuit-json-to-gltf": {
    package: "circuit-json-to-gltf",
    version: "latest",
    export: "default",
  },
  "circuit-json-to-simple-3d": {
    package: "circuit-json-to-simple-3d",
    version: "latest",
    export: "default",
  },
  "circuit-json-to-spice": {
    package: "circuit-json-to-spice",
    version: "latest",
    export: "default",
  },
  "circuit-json-to-bpc": {
    package: "circuit-json-to-bpc",
    version: "latest",
    export: "default",
  },
  "circuit-json-to-connectivity-map": {
    package: "circuit-json-to-connectivity-map",
    version: "latest",
    export: "default",
  },
  "circuit-to-svg": {
    package: "circuit-to-svg",
    version: "latest",
    export: "default",
  },
  "kicad-to-circuit-json": {
    package: "kicad-to-circuit-json",
    version: "latest",
    export: "default",
  },
  kicadts: {
    package: "kicadts",
    version: "latest",
    export: "default",
  },
} as const

export type ConverterName = keyof typeof AVAILABLE_CONVERTERS

/**
 * Dynamically load a converter from jsDelivr
 * @param converterName - Name of the converter to load
 * @returns The converter module
 */
export async function loadConverter(
  converterName: ConverterName,
): Promise<any> {
  // Check cache first
  if (CONVERTER_CACHE.has(converterName)) {
    return CONVERTER_CACHE.get(converterName)
  }

  const converterConfig = AVAILABLE_CONVERTERS[converterName]
  if (!converterConfig) {
    throw new Error(
      `Unknown converter: ${converterName}. Available converters: ${Object.keys(AVAILABLE_CONVERTERS).join(", ")}`,
    )
  }

  try {
    // Construct the CDN URL
    const url = `${CDN_BASE}/${converterConfig.package}@${converterConfig.version}/dist/index.js`

    // Use dynamic import to load the converter
    const module = await import(/* @vite-ignore */ url)

    // Extract the export
    const converter = module[converterConfig.export] || module.default || module

    // Cache it
    CONVERTER_CACHE.set(converterName, converter)

    return converter
  } catch (error) {
    throw new Error(
      `Failed to load converter ${converterName} from ${CDN_BASE}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Load multiple converters in parallel
 * @param converterNames - Array of converter names to load
 * @returns Object with converter name as key and loaded converter as value
 */
export async function loadConverters(
  converterNames: ConverterName[],
): Promise<Record<ConverterName, any>> {
  const results: Record<ConverterName, any> = {} as any

  const promises = converterNames.map((name) =>
    loadConverter(name)
      .then((converter) => {
        results[name] = converter
      })
      .catch((error) => {
        console.error(`Failed to load converter ${name}:`, error)
        throw error
      }),
  )

  await Promise.all(promises)
  return results
}

/**
 * Get a specific converter with type safety
 * @param converterName - Name of the converter
 * @returns The converter function/module
 */
export async function getConverter<T extends ConverterName>(
  converterName: T,
): Promise<any> {
  return loadConverter(converterName)
}

/**
 * Clear the converter cache
 */
export function clearConverterCache(): void {
  CONVERTER_CACHE.clear()
}

/**
 * Check if a converter is available
 * @param converterName - Name of the converter to check
 * @returns true if the converter is available
 */
export function isConverterAvailable(converterName: string): boolean {
  return converterName in AVAILABLE_CONVERTERS
}

/**
 * Get list of all available converter names
 */
export function getAvailableConverterNames(): ConverterName[] {
  return Object.keys(AVAILABLE_CONVERTERS) as ConverterName[]
}
