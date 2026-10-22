import type { CircuitJson, SourceComponent } from "circuit-json"

export interface DesignatorPrefixGroup {
  prefix: string
  designators: string[]
  numbers: number[]
  missingNumbers: number[]
  count: number
}

export interface ComponentDesignatorSummary {
  prefixes: Record<string, DesignatorPrefixGroup>
  totalComponents: number
  allDesignators: string[]
  duplicates: string[]
}

/**
 * Analyzes component designators, grouping them by prefix (e.g., R, C, U)
 * and detecting numbering gaps and duplicate designators.
 */
export function getComponentDesignators(
  circuitJson: CircuitJson,
): ComponentDesignatorSummary {
  const allDesignators: string[] = []
  const seenDesignators = new Set<string>()
  const duplicates = new Set<string>()
  const rawPrefixMap = new Map<
    string,
    Array<{ name: string; num: number | null }>
  >()

  if (!Array.isArray(circuitJson)) {
    return {
      prefixes: {},
      totalComponents: 0,
      allDesignators: [],
      duplicates: [],
    }
  }

  for (const element of circuitJson) {
    if (element.type === "source_component") {
      const comp = element as SourceComponent
      if (comp.name) {
        const name = comp.name
        allDesignators.push(name)

        if (seenDesignators.has(name)) {
          duplicates.add(name)
        } else {
          seenDesignators.add(name)
        }

        const match = name.match(/^([A-Za-z_]+)(\d+)?$/)
        const prefix = match ? match[1].toUpperCase() : "OTHER"
        const num = match && match[2] ? parseInt(match[2], 10) : null

        if (!rawPrefixMap.has(prefix)) {
          rawPrefixMap.set(prefix, [])
        }
        rawPrefixMap.get(prefix)!.push({ name, num })
      }
    }
  }

  const prefixes: Record<string, DesignatorPrefixGroup> = {}

  for (const [prefix, items] of rawPrefixMap.entries()) {
    // Sort items by numeric index if available, otherwise by name
    items.sort((a, b) => {
      if (a.num !== null && b.num !== null) return a.num - b.num
      if (a.num !== null) return -1
      if (b.num !== null) return 1
      return a.name.localeCompare(b.name)
    })

    const designators = items.map((i) => i.name)
    const numbers = items
      .map((i) => i.num)
      .filter((n): n is number => n !== null)

    const missingNumbers: number[] = []
    if (numbers.length > 1) {
      const min = Math.min(...numbers)
      const max = Math.max(...numbers)
      const numSet = new Set(numbers)
      for (let i = min + 1; i < max; i++) {
        if (!numSet.has(i)) {
          missingNumbers.push(i)
        }
      }
    }

    prefixes[prefix] = {
      prefix,
      designators,
      numbers,
      missingNumbers,
      count: designators.length,
    }
  }

  allDesignators.sort((a, b) => a.localeCompare(b))

  return {
    prefixes,
    totalComponents: allDesignators.length,
    allDesignators,
    duplicates: Array.from(duplicates).sort(),
  }
}
