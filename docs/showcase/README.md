# README showcase assets

These images come from the linked community designs. The first gallery image is a photograph; the other two are renders of the actual Circuit JSON, not enlarged registry thumbnails.

| Asset | Source |
| --- | --- |
| `rp2040-motor-controller.jpg` | [Original shop photo](https://shop.tscircuit.com/cdn/shop/files/CleanShot_2026-09-24_at_15.36.10_2x_184b343f-0b34-4785-ace1-3eb059e26147.png?v=1790289389), requested with `width=800&height=800&crop=center` and compressed as JPEG. |
| `rp2040-motor-controller-pcb.png` | `imrishabh18/rp2040-motor-controller`, release `28c2eb03-3ec2-4031-98b5-90c250084efe`, `dist/index/circuit.json`. |
| `rp2040-motor-controller-schematic.png` and `.svg` | Same release, `dist/schematic/controller_programming.svg`. |
| `nema-23-stepper-controller.jpg` | `imrishabh18/nema-23-stepper-controller`, release `d5482839-bb97-4be0-a31b-bba015f4e33f`, `dist/index/circuit.json`. |
| `rp2040-bldc-motor-controller.jpg` | `MustafaMulla29/rp2040-bldc-motor-controller-new`, release `899c4704-4a6b-4518-a941-a574537055a5`, `dist/system/circuit.json`. The external `connected-system.glb` assembly is excluded to show the complete PCB without cables obscuring it. |

## Rendering

- 3D geometry: `circuit-json-to-gltf@0.0.155`, with `boardTextureResolution: 4096`.
- 3D rasterization: `poppygl@0.0.37`, `realistic: true`, white background, grid disabled, `width: 1200`, `height: 1200`, `supersampling: 2`. Each master is rendered at 2400 × 2400 internally, then resolved to 1200 × 1200 before trimming white margins and fitting within an 800 × 800 gallery image with 32 px padding. JPEG quality 94, 4:4:4 chroma, MozJPEG.
- NEMA 23 camera: fit the complete exported scene bounds, direction `[0.7, 2.0, -0.8]`, vertical FOV 40°. All PCB corners and the complete motor fit inside the frame.
- BLDC camera: board camera direction `[-0.7, 1.4, -0.8]`, FOV 40°, camera distance multiplied by 1.25 and target raised to glTF Y=5. All PCB corners and the tall capacitor fit inside the frame.
- PCB: `circuit-to-svg@0.0.453`, top copper only, no silkscreen, ratsnest, courtyard, solder paste, fabrication notes, or group overlays. Dark background and matching drill-hole color. The underlying circuit geometry is unchanged. Render the SVG at 3200 px and downsample to a 1600 px PNG.
- Schematic: preserve the source sheet's symbols, wiring, labels, colors, and notes; crop the unused page border/margins using `viewBox="300 210 1040 680"`. Keep the vector SVG for zooming; rasterize at 3200 px and downsample to a 1600 px PNG for the README.

## Visual checks

Compared the original thumbnails with fresh renders and inspected both full-resolution and 280 px gallery previews. Checked complete-board framing, motor clearance inside the image, smooth diagonal edges, connector detail, and silkscreen sharpness. Reviewed the schematic for clipped labels/symbols and readable section headings; reviewed the PCB for uncluttered routing and intact board edges. These are presentation checks, not electrical validation of the community designs.
