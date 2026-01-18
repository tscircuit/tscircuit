export * from "@tscircuit/core"
export * from "@tscircuit/eval"
export type { ChipProps, PinLabelsProp, CommonLayoutProps } from "@tscircuit/props"

// Bun plugin exports for direct .kicad_mod imports
export {
  kicadModPlugin,
  registerKicadModPlugin,
} from "./plugins/bun-plugin-kicad-mod"
