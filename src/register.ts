import { Circuit } from "@tscircuit/core"
import { Symbol } from "./components/Symbol"

// Register the Symbol component with TSCircuit
declare global {
  namespace JSX {
    interface IntrinsicElements {
      symbol: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          name: string
          x?: number | string
          y?: number | string
          width?: number | string
          height?: number | string
          rotation?: number
        },
        HTMLElement
      >
    }
  }
}

// Register the component with Circuit
if (typeof Circuit !== 'undefined') {
  // The Symbol component will be registered through JSX types
  // No explicit registration needed for built-in components
}

export { Symbol } from "./components/Symbol"
