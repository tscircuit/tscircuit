# ⏣ tscircuit - React for Circuits

Make electronics using Typescript and React.

`tscircuit` is a library complemented by a registry, package manager, and command line tool that makes it easy to create, share, export and manufacture electronic circuits.

```ts
const Circuit = () => (
  <>
    <bug
      name="B1"
      port_arrangement={{ left_size: 3, right_size: 3 }}
      center={[0, 0]}
      footprint="sot236"
      port_labels={{
        1: "PWR",
        2: "NC",
        3: "RG",
        4: "D0",
        5: "D1",
        6: "GND",
      }}
    />
    <resistor
      x={2}
      y={-0.5}
      name="R1"
      resistance="10ohm"
      footprint="0805"
      pcb_x="4mm"
      pcb_y="-1mm"
    />
    <ground x={3} y={1} name="GND" />
    <trace path={[".B1 > .D0", ".R1 > .left"]} />
    <trace path={[".R1 > .right", ".GND > .gnd"]} />
  </>
)
```

![Example Circuit Rendering](./docs/example_render.png)

## Getting Started

You can do everything you need to do with `tscircuit` using the [`tsck`](https://github.com/tscircuit/cli) command line tool.

```bash
npm install -g @tscircuit/cli

tsck init

tsck dev

# Open your browser to http://localhost:3020!
```

![tsck Server Preview](./docs/example_preview.png)

## Development Sub-Projects / Organization

tscircuit includes a lot of different independently-runnable sub-projects. Here's
a quick guide to navigating all of the sub-projects:

### Core Libraries

| Project                                                                      | Description                                                                                              |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [@tscircuit/builder](https://github.com/tscircuit/builder)                   | A typescript-native library for building circuits (no React). Converts typescript into "the soup format" |
| [@tscircuit/cli](https://github.com/tscircuit/cli)                           | The tscircuit command line tool `tsck` and development environment                                       |
| [@tscircuit/schematic-viewer](https://github.com/tscircuit/schematic-viewer) | The Schematic renderer                                                                                   |
| [@tscircuit/pcb-viewer](https://github.com/tscircuit/pcb-viewer)             | The PCB renderer                                                                                         |

### Other Projects

- [tscircuit.com](https://tscircuit.com) - The official tscircuit website
- [registry.tscircuit.com](https://registry.tscircuit.com) - The official tscircuit registry that hosts re-usable tscircuit components
- [Community Slack](https://tscircuit.com/slack)
