# Design Rule Checking (DRC) & DFM Guidelines for tscircuit

Design for Manufacturing (DFM) ensures that your virtual schematic and PCB layout yield high assembly success rates, zero solder bridges, and cost-effective fabrication at board houses like JLCPCB, PCBWay, and OshPark.

This guide details geometric constraints, fab house tolerances, and verification checks supported in **tscircuit**.

---

## 1. Standard PCB Manufacturing Capabilities

Most standard 2-layer and 4-layer PCB manufacturing processes adhere to the following baseline constraints:

| Parameter | Standard Class (Low Cost) | Advanced Class | Notes |
| :--- | :--- | :--- | :--- |
| **Min Trace Width** | 0.127 mm (5 mil) | 0.075 mm (3 mil) | Thinner traces increase etching defect risk |
| **Min Trace Clearance** | 0.127 mm (5 mil) | 0.075 mm (3 mil) | Spacing between copper conductors |
| **Min Drill Hole** | 0.300 mm (12 mil) | 0.150 mm (6 mil) | Mechanical CNC drill vs laser micro-vias |
| **Min Annular Ring** | 0.150 mm (6 mil) | 0.100 mm (4 mil) | Copper collar surrounding drilled hole |
| **Copper to Board Edge** | 0.300 mm (12 mil) | 0.200 mm (8 mil) | 0.500 mm recommended for V-cut panellization |
| **Solder Mask Web** | 0.100 mm (4 mil) | 0.075 mm (3 mil) | Solder dam bridge between adjacent SMT pins |
| **Min Silkscreen Line** | 0.150 mm (6 mil) | 0.100 mm (4 mil) | Minimum legible ink stroke width |

---

## 2. Geometric DRC Checks in tscircuit

tscircuit provides built-in utilities to validate layouts against these rules prior to fabrication:

```tsx
import {
  checkDecouplingCapProximity,
  getMountingHoleClearances,
  getThermalViaClusters,
  getSolderPasteMaskSummary,
  getCopperPourIslands
} from "tscircuit"

// 1. Audit mounting hole keepout margins (e.g. screw head clearance >= 1.5mm)
const mountingReport = getMountingHoleClearances(circuitJson, { keepoutMarginMm: 1.5 })
if (!mountingReport.allClear) {
  console.warn("Mounting hole hardware encroached:", mountingReport.encroachments)
}

// 2. Identify unstitched or isolated floating copper fills
const islandReport = getCopperPourIslands(circuitJson)
if (islandReport.hasFloatingIslands) {
  console.warn("Floating copper fills detected:", islandReport.floatingIslands)
}
```

---

## 3. High-Density SMT & Soldering Quality

### 3.1 Solder Mask Clearance and Dams
- **Mask Webbing**: A green/black solder mask dam must separate adjacent IC pads to prevent solder bridging during convection reflow. For fine-pitch ICs (e.g. 0.5mm QFP/QFN), ensure the solder dam is at least 0.08 mm wide.
- **Solder Paste Mask Reduction**: For large exposed ground pads (e.g. QFN center pads), divide the paste mask aperture into a $2 \times 2$ or $3 \times 3$ windowed grid with 50% to 70% total paste coverage to prevent component floating and solder voiding.

### 3.2 Thermal Balancing on Passive Components
- Both pads of 0402, 0603, and 0805 passives (resistors, capacitors) should have equal copper trace widths connected to them.
- If one pad connects to a massive copper ground plane and the other connects to a thin trace, the ground pad acts as a heat sink, causing the solder to melt unevenly and resulting in component **tombstoning**.

---

## 4. Pre-Flight Fabrication Checklist

Before exporting production Gerbers, drill files, or submitting to PCB fabs:

1. [ ] **Board Dimensions & Aspect Ratio**: Check board outline closure and mounting screw hole alignment.
2. [ ] **Unconnected Ports & Floating Nets**: Run `checkUnconnectedPorts` to ensure every net is fully routed.
3. [ ] **Silkscreen Over Copper**: Ensure no silkscreen legend text or drawings overlap exposed SMT pads or testpoints.
4. [ ] **Drill Tools**: Verify drill diameter assortment using `getDrillToolSummary`.
5. [ ] **BOM Verification**: Ensure all active chips and passive passives have valid supplier part numbers (LCSC, DigiKey, Mouser).
