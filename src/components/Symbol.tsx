import React from "react"
import type { BaseComponentProps } from "../types"

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
 * A component that renders a symbol by name
 */
export const Symbol: React.FC<SymbolProps> = ({
  symbol,
  width,
  height,
  rotation = 0,
  x = 0,
  y = 0,
  ...props
}) => {
  // The actual symbol rendering will be handled by the renderer
  // This component just provides the symbol name and layout properties
  // Create a group with transform for rotation and position
  return (
    <g 
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      {...props}
    >
      <symbol
        name={symbol}
        width={width}
        height={height}
      />
    </g>
  )
}

// Add display name for better debugging
Symbol.displayName = "Symbol"

export default Symbol
