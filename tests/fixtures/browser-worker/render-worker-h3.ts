import type { WorkerRoutingResult } from "./run-packaged-worker"

/** Render the actual board-space routing result in mm, +X right, +Y up. */
export function renderWorkerH3(result: WorkerRoutingResult): string {
  const { bounds } = result.originalInput
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const traces = result.output?.traces ?? []
  const pads = result.originalInput.obstacles.map((obstacle) => {
    const x = obstacle.center.x
    const y = -obstacle.center.y
    if (obstacle.shape === "circle")
      return `<circle cx="${x}" cy="${y}" r="${obstacle.width / 2}" fill="#64748b"/>`
    return `<rect x="${x - obstacle.width / 2}" y="${y - obstacle.height / 2}" width="${obstacle.width}" height="${obstacle.height}" fill="#64748b" transform="rotate(${-(obstacle.ccwRotationDegrees ?? 0)} ${x} ${y})"/>`
  }).join("")
  const copper = traces.map((trace, index) => {
    const routePoints = trace.route.filter((point) => point.route_type === "wire" || point.route_type === "via")
    const firstWire = trace.route.find((point) => point.route_type === "wire")
    const points = routePoints.map((point) => `${point.x},${-point.y}`).join(" ")
    const vias = routePoints.filter((point) => point.route_type === "via").map((point) => {
      const diameter = point.via_diameter ?? result.originalInput.minViaPadDiameter
      if (diameter === undefined) throw new Error("Via copper diameter is missing from the routing result")
      return `<circle cx="${point.x}" cy="${-point.y}" r="${diameter / 2}" fill="hsl(${index * 32} 80% 45%)"/>`
    }).join("")
    return `<polyline points="${points}" fill="none" stroke="hsl(${index * 32} 80% 45%)" stroke-width="${firstWire?.width ?? result.originalInput.minTraceWidth}" stroke-linecap="round" stroke-linejoin="round"/>${vias}`
  }).join("")
  const status = result.outcome === "complete"
    ? `COMPLETED: ${traces.length}/11 signals routed by the shipped worker`
    : "FAILED: no complete native H3 route from the shipped worker"
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760" viewBox="0 0 1000 760"><rect width="1000" height="760" fill="white"/><g font-family="sans-serif" fill="#0f172a"><text x="24" y="30" font-size="20">Real Allwinner H3 CPU-to-DDR3 byte 0</text><text x="24" y="58" font-size="16">${status}</text><text x="24" y="82" font-size="14">479 original pads; 22 endpoints; 2 layers; 0.0889 mm source clearance; zero saved copper</text><text x="24" y="104" font-size="14">Native bus routing through the actual published browser worker; no authored timing limit</text></g><svg x="24" y="128" width="952" height="608" viewBox="${bounds.minX - 1} ${-bounds.maxY - 1} ${width + 2} ${height + 2}">${pads}${copper}</svg></svg>\n`
}
