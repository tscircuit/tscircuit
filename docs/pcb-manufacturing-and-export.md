# PCB Manufacturing & Export Guide

This guide details how to generate fabrication-ready packages from **tscircuit** designs for PCB board houses (JLCPCB, PCBWay, OSH Park) and automated SMT assembly lines.

---

## 1. Manufacturing Deliverables

A complete hardware release contains three primary deliverables:

| Deliverable | Description | Standard Formats |
| :--- | :--- | :--- |
| **Gerber Files** | Board geometry, copper traces, silkscreen, mask | RS-274X (`.gtl`, `.gbl`, `.gto`, `.gts`) |
| **Drill Files** | Through-hole and via coordinates & diameters | Excellon (`.drl`, `.txt`) |
| **Pick-and-Place (CPL)** | SMT component centroid coordinates & rotation | CSV (`Designator, Val, Package, Mid X, Mid Y, Rotation, Layer`) |
| **Bill of Materials (BOM)**| Component part numbers, descriptions, quantities | CSV (`Comment, Designator, Footprint, LCSC Part #`) |

---

## 2. Exporting with the CLI

Generate manufacturing files directly from your terminal:

```bash
# Export Gerbers and Drill archive (ZIP)
tsci export --gerbers -o dist/gerbers.zip

# Export Pick-and-Place centroid CSV
tsci export --pnp -o dist/pick-and-place.csv

# Export Bill of Materials CSV
tsci export --bom -o dist/bom.csv
```

---

## 3. Configuring SMT Assembly (JLCPCB / PCBWay)

To achieve zero-touch turnkey assembly, annotate your JSX components with `supplierPartNumbers`:

```tsx
<chip
  name="U1"
  footprint="soic8"
  supplierPartNumbers={{
    jlcpcb: ["C6186"],
    lcsc: ["C6186"],
  }}
/>
```

When exporting the BOM, tscircuit automatically populates the `LCSC Part #` column, allowing the manufacturer's automated quotation tool to instantly recognize components and verify stock levels.

---

## 4. Verification & Pre-Flight Checks

Before submitting orders:
1. **Unconnected Pins:** Run `getUnconnectedPorts` or check compiler warnings to ensure no signal pins are unintentionally floating.
2. **Net Continuity:** Validate with `checkNetContinuity` that copper traces electrically bridge all pins on every net.
3. **Drill Tools:** Review drill sizes using `getDrillSummary` to ensure hole diameters match manufacturer minimums (typically >= 0.3mm for vias).
4. **Visual Inspection:** Render vector previews using `circuitJsonToPcbSvg` or preview in 3D with the tscircuit dev viewer.
