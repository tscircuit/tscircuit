import type { CircuitJson, SourceNet, SourceTrace } from "circuit-json"

export interface VoltageDomainItem {
  netId: string
  netName: string
  voltageLevel?: string
  isPowerRail: boolean
  isGround: boolean
  connectedPortCount: number
}

export interface VoltageDomainReport {
  domains: VoltageDomainItem[]
  groundNets: string[]
  powerRails: string[]
}

function parseVoltageLevel(name: string): string | undefined {
  const upper = name.toUpperCase()
  if (upper.includes("3V3") || upper.includes("3.3V")) return "3.3V"
  if (upper.includes("1V8") || upper.includes("1.8V")) return "1.8V"
  if (upper.includes("2V5") || upper.includes("2.5V")) return "2.5V"
  if (upper.includes("5V")) return "5.0V"
  if (upper.includes("12V")) return "12.0V"
  if (upper.includes("24V")) return "24.0V"
  if (upper.includes("GND") || upper.includes("0V") || upper.includes("VSS"))
    return "0V"
  return undefined
}

/**
 * Identifies power rails, ground nets, and operating voltage domains across a circuit.
 */
export function getCircuitVoltageDomains(
  circuitJson: CircuitJson,
): VoltageDomainReport {
  if (!Array.isArray(circuitJson)) {
    return { domains: [], groundNets: [], powerRails: [] }
  }

  const netPortCounts = new Map<string, number>()
  const netNames = new Map<string, string>()

  // 1. Index nets
  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const net = el as SourceNet & { member_source_port_ids?: string[] }
      if (net.source_net_id) {
        netNames.set(net.source_net_id, net.name || net.source_net_id)
        const count = Array.isArray(net.member_source_port_ids)
          ? net.member_source_port_ids.length
          : 0
        netPortCounts.set(net.source_net_id, count)
      }
    }
  }

  // Count trace connections
  for (const el of circuitJson) {
    if (el.type === "source_trace") {
      const trace = el as SourceTrace
      const nids = trace.connected_source_net_ids || []
      const pids = trace.connected_source_port_ids || []
      for (const nid of nids) {
        netPortCounts.set(nid, (netPortCounts.get(nid) || 0) + pids.length)
      }
    }
  }

  const domains: VoltageDomainItem[] = []
  const groundNets: string[] = []
  const powerRails: string[] = []

  for (const [netId, netName] of netNames.entries()) {
    const upper = netName.toUpperCase()
    const isGround =
      upper.includes("GND") ||
      upper.includes("VSS") ||
      upper === "0V" ||
      upper.startsWith("AGND") ||
      upper.startsWith("DGND")

    const isPowerRail =
      !isGround &&
      (upper.includes("VCC") ||
        upper.includes("VDD") ||
        upper.includes("VIN") ||
        upper.includes("VBAT") ||
        upper.includes("VBUS") ||
        /\b\d+(\.\d+)?V\b/i.test(netName) ||
        /\b\d+V\d+\b/i.test(netName))

    const voltageLevel = parseVoltageLevel(netName)

    if (isGround) groundNets.push(netName)
    if (isPowerRail) powerRails.push(netName)

    domains.push({
      netId,
      netName,
      voltageLevel,
      isPowerRail,
      isGround,
      connectedPortCount: netPortCounts.get(netId) || 0,
    })
  }

  domains.sort((a, b) => a.netName.localeCompare(b.netName))
  groundNets.sort()
  powerRails.sort()

  return { domains, groundNets, powerRails }
}
