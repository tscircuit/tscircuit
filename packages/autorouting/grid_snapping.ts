export function snapToGrid(coord: { x: number; y: number }, gridSize: number) {
  return {
    x: Math.round(coord.x / gridSize) * gridSize,
    y: Math.round(coord.y / gridSize) * gridSize,
  };
}
