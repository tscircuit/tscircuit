# tscircuit Architecture & Pipeline Guide

This document describes the internal architecture of **tscircuit**, illustrating how React JSX definitions are compiled, routed, solved, and exported into fabrication-ready manufacturing files.

```
+-------------------------------------------------------------+
|                      User Circuit Code                      |
|                  (React JSX / TypeScript)                   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              Fiber & Core Virtual Circuit Graph             |
|                      (@tscircuit/core)                      |
|  - Components, subcircuits, ports, nets, and physical props |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     Solvers & Optimizers                    |
|  - Layout & Schematic placement                             |
|  - Footprint generation (@tscircuit/footprinter)            |
|  - PCB autorouting (@tscircuit/capacity-autorouter)         |
|  - Copper pour solving (@tscircuit/copper-pour-solver)      |
|  - Connectivity & ERC/DRC checks (@tscircuit/checks)        |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               Circuit JSON Intermediate Format              |
|                       (circuit-json)                        |
|  - Declarative elements: source_*, schematic_*, pcb_*, cad_*|
+-------------------------------------------------------------+
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
+---------------+     +---------------+     +---------------+
|   Renderers   |     | Manufacturing |     |  Simulation   |
| (circuit-to-  |     |   Exporters   |     |    (SPICE)    |
|     svg,      |     | (Gerbers, BOM,|     | (circuit-json-|
|  3D / GLTF)   |     |  Pick & Place)|     |   to-spice)   |
+---------------+     +---------------+     +---------------+
```

---

## 1. Core Layers

### 1.1 Declarative JSX / TSX
Circuits in tscircuit are authored using familiar React components and props:
- `<board width="50mm" height="40mm">`
- `<resistor resistance="10k" footprint="0603" />`
- `<chip name="U1" footprint="soic8" />`
- `<trace from=".U1 > .VCC" to="net.VCC_3V3" />`

### 1.2 Fiber & In-Memory Circuit Graph (`@tscircuit/core`)
`@tscircuit/core` uses a custom React reconciler (Fiber) that instantiates circuit element nodes instead of DOM nodes.
- Each component resolves its pins, labels, and electrical connectivity.
- Groups and subcircuits establish hierarchical scoping for nets and layouts.

### 1.3 Solvers & Constraint Pipeline
Before physical geometry can be output, several specialized solvers run sequentially:
1. **Footprinter (`@tscircuit/footprinter`)**: Resolves standard footprints (IPC-7351 SMD, QFN, SOIC, pin headers) into pad coordinates, silkscreen geometry, and solder mask boundaries.
2. **Schematic Placement & Routing**: Aligns schematic symbols, breaks nets into readable connection points, and routes schematic net lines.
3. **Capacity Autorouter (`@tscircuit/capacity-autorouter`)**: Evaluates obstacle maps, vias, layers, and trace clearance constraints to route copper traces between connected pads.
4. **Copper Pour Solver (`@tscircuit/copper-pour-solver`)**: Generates ground planes, thermal relief spokes, and clearance keep-outs around opposing signal traces.
5. **Electrical & Design Rule Checkers (`@tscircuit/checks`)**: Validates that no short circuits, clearance violations, or unconnected net pins exist.

### 1.4 Circuit JSON (`circuit-json`)
The output of the solver pipeline is **Circuit JSON**, a standardized, serializable array of circuit elements. Each element belongs to one of four primary domains:
- `source_*`: Logical components, ports, nets, and schematic traces.
- `schematic_*`: Visual positions, text labels, and schematic symbols.
- `pcb_*`: Physical pads, traces, vias, copper pours, silkscreen markings, and board outline polygons.
- `cad_*`: 3D model placements, STEP/GLTF references, and component heights.

---

## 2. Exporters & Downstream Targets

From Circuit JSON, specialized utilities transform the data into industry-standard deliverables:

| Target | Tool / Package | Output |
| :--- | :--- | :--- |
| **Schematic Vector** | `circuit-to-svg` | Interactive or printable SVG schematic |
| **PCB Layout Vector**| `circuit-to-svg` | High-resolution layered SVG diagram |
| **3D Rendering** | `circuit-json-to-gltf` / `simple-3d` | GLTF/GLB models for web 3D previews |
| **Fabrication** | Gerber / Excellon drill generators | ZIP archive for JLCPCB, PCBWay, etc. |
| **Assembly (PCBA)** | `circuit-json-to-pnp-csv` | Centroid / Pick-and-Place (CPL) CSV file |
| **Bill of Materials**| `getCircuitBom` / CSV export | Grouped BOM with supplier part numbers |
| **Circuit Simulation**| `circuit-json-to-spice` | SPICE netlist for ngspice transient analysis |

---

## 3. Runtimes

tscircuit is designed to run in multiple execution contexts:
1. **CLI (`tsci`)**: Local developer tooling powered by Bun for instant live reload, routing, and file exports.
2. **Web / WebWorker (`@tscircuit/eval`, `@tscircuit/runframe`)**: Browser-safe runtime enabling live coding playgrounds, web embeddings, and cloud simulations.
3. **Node / Bun Library**: Programmatic API for automated CI/CD pipelines and headless circuit generation.
