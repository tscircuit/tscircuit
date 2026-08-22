/**
 * tscircuit / tscircuit interactive trace hover styling
 */
export interface TraceStyleOptions {
  strokeColor: string;
  hoverColor: string;
  baseWidth: number;
  hoverWidthMultiplier?: number;
  transitionMs?: number;
}

export function computeTraceSvgAttributes(isHovered: boolean, opts: TraceStyleOptions) {
  const multiplier = opts.hoverWidthMultiplier || 1.6;
  const transition = opts.transitionMs || 150;
  return {
    stroke: isHovered ? opts.hoverColor : opts.strokeColor,
    strokeWidth: isHovered ? opts.baseWidth * multiplier : opts.baseWidth,
    style: `transition: stroke ${transition}ms ease, stroke-width ${transition}ms ease;`
  };
}
