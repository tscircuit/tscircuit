export * from "@tscircuit/core"
export * from "@tscircuit/eval"
export type { ChipProps, PinLabelsProp, CommonLayoutProps } from "@tscircuit/props"

// KiCad MOD plugin exports
export {
  kicadModPlugin,
  registerKicadModPlugin,
} from "./plugins/bun-plugin-kicad-mod"
