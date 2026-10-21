import type {
  AnyCircuitElement,
  CircuitJson,
  SourceComponent,
} from "circuit-json"

export interface BomCategoryCost {
  count: number
  unitPrice: number
  totalCost: number
}

export interface BomCostEstimateReport {
  totalComponents: number
  estimatedUnitCost: number
  volumeTier: number
  breakdownByCategory: Record<string, BomCategoryCost>
}

const DEFAULT_PRICES: Record<string, number> = {
  resistor: 0.01,
  capacitor: 0.015,
  inductor: 0.05,
  diode: 0.08,
  transistor: 0.15,
  chip: 1.25,
  connector: 0.45,
  other: 0.1,
}

/**
 * Estimates BOM component hardware cost based on component categories
 * and volume production discounts.
 */
export function estimateCircuitBomCost(
  circuitJson: CircuitJson,
  options: {
    volumeTier?: 1 | 10 | 100 | 1000
    customPrices?: Partial<Record<string, number>>
  } = {},
): BomCostEstimateReport {
  const volume = options.volumeTier ?? 1
  const prices = { ...DEFAULT_PRICES, ...options.customPrices }

  // Volume scale factor
  const discountMultiplier =
    volume >= 1000 ? 0.55 : volume >= 100 ? 0.7 : volume >= 10 ? 0.85 : 1.0

  if (!Array.isArray(circuitJson)) {
    return {
      totalComponents: 0,
      estimatedUnitCost: 0,
      volumeTier: volume,
      breakdownByCategory: {},
    }
  }

  const categoryCounts: Record<string, number> = {}

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "source_component") {
      const sc = element as SourceComponent
      const ftype = ((sc as any).ftype || "").toLowerCase()
      const name = (sc.name || "").toUpperCase()

      let cat = "other"
      if (ftype.includes("resistor") || name.startsWith("R")) {
        cat = "resistor"
      } else if (ftype.includes("capacitor") || name.startsWith("C")) {
        cat = "capacitor"
      } else if (ftype.includes("inductor") || name.startsWith("L")) {
        cat = "inductor"
      } else if (
        ftype.includes("diode") ||
        name.startsWith("D") ||
        name.startsWith("LED")
      ) {
        cat = "diode"
      } else if (ftype.includes("transistor") || name.startsWith("Q")) {
        cat = "transistor"
      } else if (
        ftype.includes("chip") ||
        name.startsWith("U") ||
        name.startsWith("IC")
      ) {
        cat = "chip"
      } else if (
        ftype.includes("connector") ||
        ftype.includes("header") ||
        name.startsWith("J")
      ) {
        cat = "connector"
      }

      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    }
  }

  const breakdownByCategory: Record<string, BomCategoryCost> = {}
  let totalCost = 0
  let totalComponents = 0

  for (const [cat, count] of Object.entries(categoryCounts)) {
    const basePrice = prices[cat] ?? prices.other
    const unitPrice = Math.round(basePrice * discountMultiplier * 1000) / 1000
    const catTotal = Math.round(unitPrice * count * 100) / 100

    breakdownByCategory[cat] = {
      count,
      unitPrice,
      totalCost: catTotal,
    }

    totalCost += catTotal
    totalComponents += count
  }

  return {
    totalComponents,
    estimatedUnitCost: Math.round(totalCost * 100) / 100,
    volumeTier: volume,
    breakdownByCategory,
  }
}
