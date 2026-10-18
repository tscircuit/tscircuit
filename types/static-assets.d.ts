declare module "*.obj" {
  const src: string
  export default src
}

declare module "*.stl" {
  const src: string
  export default src
}

declare module "*.kicad_mod" {
  const src: string
  export default src
}

declare module "*.kicad_sym" {
  const src: string
  export default src
}

declare module "*.kicad_pcb" {
  import type { AnyCircuitElement } from "circuit-json"

  export const Board: (props: any) => any
  export const boardContentCircuitJson: AnyCircuitElement[]
  export const circuitJson: AnyCircuitElement[]

  const circuitJsonDefault: AnyCircuitElement[]
  export default circuitJsonDefault
}

declare module "*.kicad_sch" {
  import type { AnyCircuitElement } from "circuit-json"

  export const circuitJson: AnyCircuitElement[]
  const circuitJsonDefault: AnyCircuitElement[]
  export default circuitJsonDefault
}

declare module "*.circuit.json" {
  import type { AnyCircuitElement } from "circuit-json"

  const circuitJson: AnyCircuitElement[]
  export default circuitJson
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

declare module "*.stp" {
  const src: string
  export default src
}

declare module "*.dxf" {
  const src: string
  export default src
}
