# Manual Installation

## Recommended: Configure project for usage with `tsci dev`

You can add tscircuit to an existing project, or manually initialize an npm project
for usage with `tsci dev`. Here's what you do:

1. Install `@tscircuit/react-fiber` and `@tscircuit/builder` (note: in the future you can just install `tscircuit`)
2. Add a `.npmrc` file with `@tsci:registry=https://registry.tscircuit.com/npm` (this will allow you to install
   packages from the tscircuit registry)
3. Add `@tscircuit/react-fiber` to `tsconfig.json` inside `compilerOptions.types` (you can skip this if you just do
   `import "@tscircuit/react-fiber"` to load types inside any entrypoint)

## Advanced: Developing without `tsci dev`

You can directly install and use `@tscircuit/schematic-viewer` and `@tscircuit/pcb-viewer` to view
circuits in any React project.

```ts
import { Schematic } from "@tscircuit/schematic-viewer"

export default () => (
  <Schematic>
    <resistor resistance="10kohm" name="R1" />
  </Schematic>
)
```
