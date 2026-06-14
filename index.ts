export * from "@tscircuit/core"
export * from "@tscircuit/eval"
export type { AnyCircuitElement, CircuitJson } from "circuit-json"
export type { ChipProps, PinLabelsProp, CommonLayoutProps } from "@tscircuit/props"
export { kicadFootprintStrings } from "@tscircuit/props"
/**
 * Combine same-net trace segments that are close together
 * @param traces Array of trace segments
 * @param threshold Maximum distance to combine (in mm)
 * @returns Combined trace segments
 */
export function combineTraces(traces: any[], threshold: number = 0.01): any[] {
  if (traces.length <= 1) return [...traces];

  const combined: any[] = [];
  const remaining = [...traces];

  while (remaining.length > 0) {
    const current = remaining.shift();
    let merged = false;

    for (let i = 0; i < combined.length; i++) {
      const target = combined[i];

      if (target.net !== current.net) continue;
      if (target.layer !== current.layer) continue;

      const targetStart = target.start;
      const targetEnd = target.end;
      const currentStart = current.start;
      const currentEnd = current.end;

      const isHorizontal = (start: any, end: any) => Math.abs(start.y - end.y) < threshold;
      const isVertical = (start: any, end: any) => Math.abs(start.x - end.x) < threshold;

      const targetHorizontal = isHorizontal(targetStart, targetEnd);
      const targetVertical = isVertical(targetStart, targetEnd);
      const currentHorizontal = isHorizontal(currentStart, currentEnd);
      const currentVertical = isVertical(currentStart, currentEnd);

      if (targetHorizontal && currentHorizontal) {
        if (Math.abs(targetStart.y - currentStart.y) > threshold) continue;

        const minX = Math.min(targetStart.x, targetEnd.x, currentStart.x, currentEnd.x);
        const maxX = Math.max(targetStart.x, targetEnd.x, currentStart.x, currentEnd.x);
        const y = targetStart.y;

        const targetRight = Math.max(targetStart.x, targetEnd.x);
        const currentLeft = Math.min(currentStart.x, currentEnd.x);

        if (targetRight > currentLeft - threshold) {
          target.start = { x: minX, y };
          target.end = { x: maxX, y };
          merged = true;
          break;
        }
      } else if (targetVertical && currentVertical) {
        if (Math.abs(targetStart.x - currentStart.x) > threshold) continue;

        const minY = Math.min(targetStart.y, targetEnd.y, currentStart.y, currentEnd.y);
        const maxY = Math.max(targetStart.y, targetEnd.y, currentStart.y, currentEnd.y);
        const x = targetStart.x;

        const targetTop = Math.max(targetStart.y, targetEnd.y);
        const currentBottom = Math.min(currentStart.y, currentEnd.y);

        if (targetTop > currentBottom - threshold) {
          target.start = { x, y: minY };
          target.end = { x, y: maxY };
          merged = true;
          break;
        }
      }
    }

    if (!merged) {
      combined.push({ ...current });
    }
  }

  return combined;
}