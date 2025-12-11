/**
 * Example: How to use the Dynamic Converter Loader
 *
 * This demonstrates the new way to load converters on-the-fly
 * from jsDelivr CDN instead of bundling them.
 */

import {
  getAvailableConverterNames,
  isConverterAvailable,
  loadConverter,
  loadConverters,
} from "tscircuit"

// Example 1: Load a single converter
async function example1_loadSingleConverter() {
  console.log("Example 1: Loading a single converter")

  try {
    // Load circuit-json-to-spice converter
    const _circuitJsonToSpice = await loadConverter("circuit-json-to-spice")
    console.log("✓ Loaded circuit-json-to-spice converter")

    // Use it to convert circuit JSON to SPICE netlist
    // const spiceCode = circuitJsonToSpice(circuitJsonData);
  } catch (error) {
    console.error("Failed to load converter:", error)
  }
}

// Example 2: Load multiple converters in parallel
async function example2_loadMultipleConverters() {
  console.log("Example 2: Loading multiple converters")

  try {
    const _converters = await loadConverters([
      "circuit-json-to-gltf",
      "circuit-json-to-simple-3d",
      "circuit-to-svg",
    ])

    console.log("✓ Loaded all converters:")
    Object.keys(_converters).forEach((name) => {
      console.log(`  - ${name}`)
    })

    // Use them
    // const gltf = converters["circuit-json-to-gltf"](circuitJsonData);
    // const svg = converters["circuit-to-svg"](circuitJsonData);
  } catch (error) {
    console.error("Failed to load converters:", error)
  }
}

// Example 3: Check available converters
async function example3_listAvailableConverters() {
  console.log("Example 3: List available converters")

  const available = getAvailableConverterNames()
  console.log("Available converters:")
  available.forEach((name) => {
    console.log(`  - ${name}`)
  })

  // Check if a specific converter is available
  if (isConverterAvailable("circuit-json-to-gerber")) {
    console.log("✓ circuit-json-to-gerber is available")
  }
}

// Example 4: Lazy-load converters on demand
async function example4_lazyLoadOnDemand(
  converterName: string,
  _circuitJson: any,
) {
  console.log(`Example 4: Lazy-loading ${converterName}`)

  try {
    // Only load the converter when needed
    if (!isConverterAvailable(converterName)) {
      console.error(`Converter ${converterName} is not available`)
      return
    }

    const _converter = await loadConverter(
      converterName as Parameters<typeof loadConverter>[0],
    )
    console.log(`✓ Loaded ${converterName}`)

    // Convert the circuit JSON
    // const result = converter(circuitJson);
    // return result;
  } catch (error) {
    console.error(`Failed to load converter ${converterName}:`, error)
  }
}

// Example 5: Error handling
async function example5_errorHandling() {
  console.log("Example 5: Error handling")

  try {
    // Try to load a non-existent converter
    await loadConverter("non-existent-converter" as any)
  } catch (error) {
    console.error(
      "Expected error:",
      error instanceof Error ? error.message : error,
    )
  }

  try {
    // Try to load with network issues (graceful fallback)
    const _converter = await loadConverter("circuit-json-to-spice")
    console.log("✓ Successfully loaded with fallback")
  } catch (error) {
    console.error("Failed to load converter:", error)
    // Fallback logic here
  }
}

// Run examples
async function _runExamples() {
  await example1_loadSingleConverter()
  console.log()

  await example2_loadMultipleConverters()
  console.log()

  await example3_listAvailableConverters()
  console.log()

  await example4_lazyLoadOnDemand("circuit-json-to-svg", {})
  console.log()

  await example5_errorHandling()
}

// Uncomment to run examples:
// runExamples().catch(console.error);
