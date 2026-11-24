---
name: tscircuit
description: Design circuit boards in TypeScript/React with tscircuit and the tsci CLI. Use when the user wants to start a tscircuit project, write or fix *.circuit.tsx files, pick parts and footprints, route a PCB, preview schematics and PCBs, export Gerbers/KiCad/BOM files, or publish a package with tsci push.
---

# tscircuit

tscircuit describes electronics as React components. A circuit file exports a
component that returns a `<board>`; the `tsci` CLI evaluates it into Circuit
JSON, autoroutes the PCB, runs design checks, and exports manufacturing files.

## Before you start

- If the project has `.agents/skills/tscircuit/` or `.claude/skills/tscircuit/`
  (`tsci init` adds it), read that skill's `SKILL.md` too. It is the full
  reference for element props, footprints, schematic layout and routing.
- Don't invent JSX props or CLI flags. Check `tsci <command> --help`, the
  element docs at https://docs.tscircuit.com/elements, or the whole docs site
  as plain text at https://docs.tscircuit.com/llms.txt.

## Setup

```bash
npm install -g tscircuit      # or: bun install --global tscircuit
tsci init my-board -y         # index.circuit.tsx, package.json, tscircuit.config.json
cd my-board
```

In an existing repo, `tsci init -y` bootstraps the current directory. Use
`--no-install` to skip installing dependencies.

## Writing a circuit

```tsx
export default () => (
  <board width="20mm" height="15mm">
    <pinheader name="J1" pinCount={2} pitch="2.54mm" pinLabels={["VCC", "GND"]} pcbX={-6} />
    <resistor name="R1" resistance="330" footprint="0603" pcbX={2} pcbY={3} />
    <led name="D1" color="red" footprint="led0603" pcbX={2} pcbY={-3} />
    <trace from=".J1 > .VCC" to="net.VCC" />
    <trace from=".J1 > .GND" to="net.GND" />
    <trace from="net.VCC" to=".R1 > .pin1" />
    <trace from=".R1 > .pin2" to=".D1 > .anode" />
    <trace from=".D1 > .cathode" to="net.GND" />
  </board>
)
```

- Every part needs a unique `name` (its reference designator: `R1`, `U1`, `J1`).
- Connect with `<trace from to />`. Ports are CSS-like selectors: `.R1 > .pin1`,
  `.D1 > .anode`, `.U1 > .VCC`. Shared rails use `net.NAME`.
- Plain numbers are millimetres; strings can carry units (`"0.1in"`, `"2.54mm"`).
- Place parts with `pcbX`/`pcbY`/`pcbRotation` and, for the schematic,
  `schX`/`schY`/`schRotation`. Leave routing to the autorouter.
- Footprints are footprinter strings (`0402`, `0603`, `soic8`, `qfn32`,
  `led0603`) or library footprints (`kicad:...`, `jlcpcb:C14877`). Check one
  with `tsci inspect footprint <footprint>` before placing it.
- For chips, use `<chip>` with `pinLabels` (e.g. `pin1: "VCC"`) so traces can
  use readable names. Reusable chips can be typed with `ChipProps` from
  `tscircuit`.
- USB-C: use `<connector standard="usb_c" />` instead of importing a part.

## Finding parts

```bash
tsci search --jlcpcb "ATmega328"   # returns the C number tsci import takes
tsci search --kicad "QFP-32"        # KiCad footprints
tsci search --tscircuit "LED"       # registry packages
tsci import --jlcpcb C14877         # bring a JLCPCB part into the project
tsci add seveibar/PICO_W            # add a registry package (@tsci/seveibar.PICO_W)
```

A flagless `tsci search` queries every source and is slow; pass the source flag
you need.

## Build, check, preview

```bash
tsci build                  # writes dist/<entry>/circuit.json, exits 1 on errors
tsci check netlist          # also: placement, routing-difficulty, shorts, schematic-placement
tsci snapshot               # schematic + PCB snapshots (--3d for a 3D view)
tsci dev                    # live preview at http://localhost:3020
```

Prefer `tsci build` and `tsci check` when iterating as an agent: they are
non-interactive and print every error and warning. Fix errors such as
mismatched diode polarity or unconnected required pins rather than passing
`--ignore-errors`. Use `tsci dev` when the user wants to look at the board.

## Export and publish

```bash
tsci export index.circuit.tsx -f gerbers -o gerbers.zip
tsci export index.circuit.tsx -f kicad_zip -o board-kicad.zip
tsci export index.circuit.tsx -f schematic-svg -o schematic.svg
tsci login                  # once per machine
tsci push                   # publish the package to the tscircuit registry
```

Other `-f` formats include `pcb-svg`, `pcb-png`, `readable-netlist`, `step`,
`glb` and `specctra-dsn`; `tsci export --help` lists them all. `tsci push`
publishes under the user's account, so only run it when they ask.
