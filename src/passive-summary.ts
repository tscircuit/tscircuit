import type { CircuitJson, SourceComponent } from "circuit-json"

export interface PassiveComponentsReport {
  totalResistors: number
  totalCapacitors: number
  totalInductors: number
  totalPassives: number
  totalActives: number
  resistorValues: Record<string, number>
  capacitorValues: Record<string, number>
  inductorValues: Record<string, number>
}

/**
 * Summarizes passive components (resistors, capacitors, inductors) and their value distributions.
 */
export function getPassiveComponentsSummary(
  circuitJson: CircuitJson,
): PassiveComponentsReport {
  const resistorValues: Record<string, number> = {}
  const capacitorValues: Record<string, number> = {}
  const inductorValues: Record<string, number> = {}

  let totalResistors = 0
  let totalCapacitors = 0
  let totalInductors = 0
  let totalActives = 0

  if (!Array.isArray(circuitJson)) {
    return {
      totalResistors: 0,
      totalCapacitors: 0,
      totalInductors: 0,
      totalPassives: 0,
      totalActives: 0,
      resistorValues: {},
      capacitorValues: {},
      inductorValues: {},
    }
  }

  for (const element of circuitJson) {
    if (element.type === "source_component") {
      const comp = element as SourceComponent
      const ftype = ((comp as any).ftype || "").toLowerCase()
      const name = comp.name || ""
      const upperName = name.toUpperCase()

      // Resistor
      if (ftype === "resistor" || /^R\d+$/i.test(name)) {
        totalResistors++
        const val =
          (comp as any).resistance || (comp as any).value || "unspecified"
        const valStr = String(val)
        resistorValues[valStr] = (resistorValues[valStr] || 0) + 1
      }
      // Capacitor
      else if (ftype === "capacitor" || /^C\d+$/i.test(name)) {
        totalCapacitors++
        const val =
          (comp as any).capacitance || (comp as any).value || "unspecified"
        const valStr = String(val)
        capacitorValues[valStr] = (capacitorValues[valStr] || 0) + 1
      }
      // Inductor
      else if (ftype === "inductor" || /^L\d+$/i.test(name)) {
        totalInductors++
        const val =
          (comp as any).inductance || (comp as any).value || "unspecified"
        const valStr = String(val)
        inductorValues[valStr] = (inductorValues[valStr] || 0) + 1
      }
      // Actives / ICs / Microcontrollers / Transistors
      else if (
        ftype === "chip" ||
        ftype === "ic" ||
        /^U\d+$/i.test(name) ||
        /^Q\d+$/i.test(name) ||
        /^IC\d+$/i.test(name)
      ) {
        totalActives++
      }
    }
  }

  return {
    totalResistors,
    totalCapacitors,
    totalInductors,
    totalPassives: totalResistors + totalCapacitors + totalInductors,
    totalActives,
    resistorValues,
    capacitorValues,
    inductorValues,
  }
}
