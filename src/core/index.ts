export interface CircuitJson {
  type: 'circuit';
  nodes: Node[];
  nets: Net[];
  footprints: Footprint[];
  // Add other properties as needed
}

export interface Node {
  id: string;
  // Node properties
}

export interface Net {
  id: string;
  nodes: string[];
  // Net properties
}

export interface Footprint {
  id: string;
  type: 'footprint';
  pads: Pad[];
  silkscreen: SilkscreenElement[];
  // Other footprint elements
}

export interface Pad {
  id: string;
  shape: 'rect' | 'circle' | 'oval';
  size: { x: number; y: number };
  position: { x: number; y: number };
  net?: string;
}

export interface SilkscreenElement {
  type: 'line' | 'circle' | 'arc';
  // Element properties
}

export type FootprintCircuitJson = CircuitJson & { type: 'footprint' };
