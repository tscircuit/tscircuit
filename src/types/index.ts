/**
 * Base component props that all components should extend
 */
export interface BaseComponentProps {
  /** Unique identifier for the component */
  id?: string
  
  /** Class name for styling */
  className?: string
  
  /** Children components */
  children?: React.ReactNode
  
  /** Style object */
  style?: React.CSSProperties
}

/**
 * Supported component types
 */
export type ComponentType = 
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'diode'
  | 'led'
  | 'transistor'
  | 'ic'
  | 'symbol'
  | string // Allow custom component types

/**
 * Symbol component properties
 */
export interface SymbolProps extends BaseComponentProps {
  /** The name of the symbol to render */
  symbol: string
  
  /** Optional width of the symbol */
  width?: number | string
  
  /** Optional height of the symbol */
  height?: number | string
  
  /** Optional rotation in degrees */
  rotation?: number
  
  /** Optional x position */
  x?: number | string
  
  /** Optional y position */
  y?: number | string
}

/**
 * Component that can be rendered by the circuit
 */
export interface CircuitComponent {
  /** Component type */
  type: ComponentType | React.ComponentType<any>
  
  /** Component props */
  props: Record<string, any>
  
  /** Child components */
  children?: CircuitComponent[]
}
