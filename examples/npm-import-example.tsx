/**
 * Example of using npm imports in tscircuit
 * 
 * This demonstrates how to import and use external npm packages
 * alongside tscircuit components.
 */

// External npm package imports (these will be resolved automatically)
import lodash from "lodash"
import { format } from "date-fns"

// tscircuit imports (always available)
import { Circuit, Resistor, Capacitor } from "@tscircuit/core"

// Example: Using lodash for component generation
const resistorValues = lodash.range(1, 5).map(i => i * 1000)

// Example: Using date-fns for naming
const timestamp = format(new Date(), "yyyy-MM-dd")

export default function MyCircuit() {
  return (
    <Circuit>
      {/* Generate resistors using lodash */}
      {resistorValues.map((value, index) => (
        <Resistor
          key={`R${index}`}
          name={`R${index}_${timestamp}`}
          resistance={`${value}ohm`}
          footprint="0805"
        />
      ))}
      
      {/* Regular tscircuit components */}
      <Capacitor
        name="C1"
        capacitance="0.1uF"
        footprint="0603"
      />
    </Circuit>
  )
}

/**
 * Usage Instructions:
 * 
 * CLI:
 * 1. Install dependencies: npm install lodash date-fns
 * 2. Run with tscircuit CLI: tsci dev npm-import-example.tsx
 * 
 * Web (tscircuit.com):
 * - The imports will automatically use CDN versions
 * - No installation needed
 * 
 * The npm import system will:
 * - Bundle dependencies for CLI usage
 * - Transform to CDN URLs for web usage
 * - Preserve @tscircuit/* imports as-is
 */