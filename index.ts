export * from "@tscircuit/core"
export * from "@tscircuit/eval"
export type { AnyCircuitElement, CircuitJson } from "circuit-json"
export type { ChipProps, PinLabelsProp, CommonLayoutProps } from "@tscircuit/props"
export { kicadFootprintStrings } from "@tscircuit/props"
/**
 * Merge collinear trace segments that are on the same net
 * and are very close (within threshold) to each other.
 */
export function mergeTraces(traces: any[], threshold: number = 0.01): any[] {
  const merged: any[] = [];

  for (const trace of traces) {
    let mergedIntoExisting = false;

    for (let i = 0; i < merged.length; i++) {
      const existing = merged[i];

      if (existing.net !== trace.net) continue;
      if (existing.layer !== trace.layer) continue;

      const existingStart = existing.start;
      const existingEnd = existing.end;
      const traceStart = trace.start;
      const traceEnd = trace.end;

      const isSameOrientation =
        (Math.abs(existingStart.y - existingEnd.y) < threshold &&
         Math.abs(traceStart.y - traceEnd.y) < threshold &&
         Math.abs(existingStart.y - traceStart.y) < threshold) ||
        (Math.abs(existingStart.x - existingEnd.x) < threshold &&
         Math.abs(traceStart.x - traceEnd.x) < threshold &&
         Math.abs(existingStart.x - traceStart.x) < threshold);

      if (!isSameOrientation) continue;

      const startDist = Math.hypot(existingStart.x - traceStart.x, existingStart.y - traceStart.y);
      const endDist = Math.hypot(existingEnd.x - traceEnd.x, existingEnd.y - traceEnd.y);

      if (startDist < threshold && endDist < threshold) {
        existing.start = {
          x: Math.min(existingStart.x, traceStart.x),
          y: Math.min(existingStart.y, traceStart.y)
        };
        existing.end = {
          x: Math.max(existingEnd.x, traceEnd.x),
          y: Math.max(existingEnd.y, traceEnd.y)
        };
        mergedIntoExisting = true;
        break;
      }
    }

    if (!mergedIntoExisting) {
      merged.push({ ...trace });
    }
  }

  return merged;
}