import type { AnyCircuitElement, CircuitJson, SourceNet } from "circuit-json"

export interface PlaneCoverageReport {
  totalCopperPours: number
  hasGroundPlane: boolean
  hasPowerPlane: boolean
  planeNets: string[]
  missingCrucialPlanes: string[]
}

const GND_REGEX = /^(gnd|ground|0v|vss)$/i
const POWER_REGEX = /^(vcc|vdd|3v3|5v|1v8|12v|vbat|vbus|vin|\+?[0-9.]+v)$/i

/**
 * Checks for dedicated copper ground and power plane pours
 * to ensure proper return paths and EMC/signal integrity compliance.
 */
export function checkPowerGroundPlaneCoverage(
  circuitJson: CircuitJson,
): PlaneCoverageReport {
  if (!Array.isArray(circuitJson)) {
    return {
      totalCopperPours: 0,
      hasGroundPlane: false,
      hasPowerPlane: false,
      planeNets: [],
      missingCrucialPlanes: ["GND", "Power"],
    }
  }

  const netNames = new Map<string, string>()

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "source_net") {
      const sn = element as SourceNet
      netNames.set(sn.source_net_id, sn.name || sn.source_net_id)
    }
  }

  let totalCopperPours = 0
  const planeNetsSet = new Set<string>()

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "pcb_copper_pour") {
      totalCopperPours++
      const netId = (element as any).source_net_id || (element as any).net_id
      const netName = netId ? netNames.get(netId) || netId : "UNNAMED"
      planeNetsSet.add(netName)
    }
  }

  const planeNets = Array.from(planeNetsSet)
  const hasGroundPlane = planeNets.some((name) => GND_REGEX.test(name.trim()))
  const hasPowerPlane = planeNets.some((name) => POWER_REGEX.test(name.trim()))

  const missingCrucialPlanes: string[] = []
  if (!hasGroundPlane) missingCrucialPlanes.push("GND")
  if (!hasPowerPlane) missingCrucialPlanes.push("Power")

  return {
    totalCopperPours,
    hasGroundPlane,
    hasPowerPlane,
    planeNets,
    missingCrucialPlanes,
  }
}
