import React from "react"
import type { BaseComponentProps, ComponentType } from "../types"
import type { SymbolProps } from "./Symbol"

interface NormalComponentProps extends BaseComponentProps {
  /** The type of the component */
  type: ComponentType
  
  /** Symbol name (alias for symbolName) */
  symbol?: string
  
  /** Symbol name */
  symbolName?: string
  
  /** Other props */
  [key: string]: any
}

/**
 * A component that can render different types of components
 */
export const NormalComponent: React.FC<NormalComponentProps> = ({
  type,
  symbol,
  symbolName,
  ...props
}) => {
  // Use symbol prop as an alias for symbolName
  const effectiveSymbolName = symbol || symbolName
  
  // Handle symbol rendering
  if (effectiveSymbolName) {
    return (
      <symbol
        name={effectiveSymbolName}
        {...props}
      />
    )
  }
  
  // Default rendering for other component types
  return React.createElement(type, props, props.children)
}

// Add display name for better debugging
NormalComponent.displayName = "NormalComponent"

export default NormalComponent
