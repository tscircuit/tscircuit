# TSCircuit Example Project

This example demonstrates how to use TSCircuit to create a simple PCB design with a microcontroller and LED.

## Features Demonstrated

- Creating a PCB layout with components
- Adding power and ground connections
- Placing and connecting components
- Generating manufacturing files (Gerber, BOM, Pick & Place)
- Visualizing the circuit

## Getting Started

1. Make sure you have Bun installed:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the project:
   ```bash
   bun run build
   ```

4. Run the example:
   ```bash
   bun run example.tsx
   ```

## Understanding the Example

The `example.tsx` file creates a simple circuit with:
- A power supply (5V)
- A microcontroller
- An LED with current-limiting resistor
- All necessary connections

## Exporting Manufacturing Files

The example automatically generates:
- Gerber files in `./gerber_output/`
- Bill of Materials (BOM)
- Pick and Place data

## Viewing the Design

To visualize the design, you can use the TSCircuit CLI:

```bash
bunx @tscircuit/cli serve
```

Then open your browser to the provided URL to see an interactive view of your circuit.

## Next Steps

- Modify the circuit in `example.tsx`
- Add more components from the TSCircuit library
- Create custom components
- Explore the [TSCircuit documentation](https://docs.tscircuit.com)
