declare module "*.obj" {
  const src: string
  export default src
}

declare module "*.stl" {
  const src: string
  export default src
}

import type { CircuitJson } from "circuit-json"

declare module "*.kicad_mod" {
  const footprintCircuitJson: CircuitJson | Promise<CircuitJson>
  export default footprintCircuitJson
}

declare module "*.glb" {
  const src: string
  export default src
}

declare module "*.gltf" {
  const src: string
  export default src
}

declare module "*.step" {
  const src: string
  export default src
}
