# Symbol Component

The `Symbol` component in TSCircuit allows you to render reusable circuit symbols in your designs. It's particularly useful for creating custom components or reusing common symbols across your circuit designs.

## Basic Usage

```tsx
import { Symbol } from "tscircuit"

// In your circuit
<board width={100} height={100}>
  <Symbol 
    symbol="resistor" 
    x={50} 
    y={50} 
    width={20} 
    height={10}
    rotation={45}
  />
</board>
```

## Props

| Prop      | Type               | Required | Description                                    |
|-----------|--------------------|----------|------------------------------------------------|
| symbol    | `string`           | Yes      | The name of the symbol to render              |
| x         | `number \| string` | No       | X position (default: 0)                       |
| y         | `number \| string` | No       | Y position (default: 0)                       |
| width     | `number \| string` | No       | Width of the symbol                           |
| height    | `number \| string` | No       | Height of the symbol                          |
| rotation  | `number`           | No       | Rotation in degrees (default: 0)              |
| className | `string`           | No       | Additional CSS class names                    |
| style     | `CSSProperties`    | No       | Additional inline styles                      |

## Using with NormalComponent

You can also use symbols with the `NormalComponent` by using the `symbol` or `symbolName` prop:

```tsx
import { NormalComponent } from "tscircuit"

// These are equivalent
<NormalComponent type="custom" symbol="my-symbol" />
<NormalComponent type="custom" symbolName="my-symbol" />
```

## Creating Custom Symbols

To create a custom symbol, you can define it using SVG and register it with TSCircuit:

```tsx
// Define your custom symbol
const MyCustomSymbol = () => (
  <symbol id="my-custom-symbol" viewBox="0 0 100 100">
    <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" />
    <circle cx="50" cy="50" r="30" fill="red" />
  </symbol>
)

// Register the symbol
TSCircuit.registerSymbol('my-custom-symbol', MyCustomSymbol)

// Use the symbol in your circuit
<Symbol symbol="my-custom-symbol" x={50} y={50} width={20} height={20} />
```

## Best Practices

1. **Reuse Symbols**: Define commonly used symbols once and reuse them throughout your design.
2. **Consistent Sizing**: Maintain consistent sizes for similar symbols to ensure a clean design.
3. **Use Meaningful Names**: Give your symbols descriptive names that indicate their purpose.
4. **Documentation**: Document your custom symbols with examples and usage guidelines.

## Examples

### Basic Usage

```tsx
<board width={100} height={100}>
  <Symbol symbol="resistor" x={20} y={20} width={30} height={10} />
  <Symbol symbol="capacitor" x={60} y={20} width={15} height={15} />
  <Symbol symbol="inductor" x={20} y={50} width={30} height={10} rotation={90} />
</board>
```

### With Connections

```tsx
<board width={100} height={100}>
  <Symbol symbol="opamp" x={30} y={30} width={40} height={30} />
  
  <power name="VCC" x={10} y={20} />
  <ground name="GND" x={10} y={80} />
  
  <trace path={[".VCC > .positive", ".opamp > .vcc"]} />
  <trace path={[".GND > .gnd", ".opamp > .gnd"]} />
</board>
```
