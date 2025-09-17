export * from "@tscircuit/core"
export * from "@tscircuit/eval"
export type { ChipProps, PinLabelsProp } from "@tscircuit/props"

// Extended types for ratsNestColor feature
export interface RatsNestColorProps {
  ratsNestColor?: string
}

// Helper function to add ratsNestColor to any component
export function withRatsNestColor<T extends Record<string, any>>(
  props: T, 
  color: string
): T & { ratsNestColor: string } {
  return { ...props, ratsNestColor: color }
}