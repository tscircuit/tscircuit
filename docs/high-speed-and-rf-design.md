# High-Speed Digital & RF PCB Design Guide in tscircuit

Modern electronics frequently operate at signal frequencies where traces behave as transmission lines rather than ideal conductors. This guide covers core principles, calculation guidelines, and code patterns for implementing high-speed digital buses (USB, PCIe, SPI, I2C, DDR) and RF circuitry with **tscircuit**.

---

## 1. Controlled Impedance Routing

When signal rise times ($t_r$) satisfy $t_r < 2 \times t_{pd}$ (where $t_{pd}$ is the propagation delay along the trace), transmission line effects dominate. Impedance matching prevents signal reflections, ringing, and overshoot.

### 1.1 Microstrip (Outer Layers)

For a microstrip trace on top or bottom copper over a reference ground plane:

$$Z_0 \approx \frac{87}{\sqrt{\epsilon_r + 1.41}} \ln\left(\frac{5.98h}{0.8w + t}\right)$$

Where:
- $w$: Trace width (mm)
- $h$: Dielectric height between trace and reference plane (mm)
- $t$: Copper thickness (typically 35µm / 1 oz = 0.035 mm)
- $\epsilon_r$: Relative permittivity of dielectric (e.g. 4.4 for standard FR-4)

### 1.2 Stripline (Internal Layers)

For symmetrical striplines sandwiched between two continuous ground planes:

$$Z_0 \approx \frac{60}{\sqrt{\epsilon_r}} \ln\left(\frac{1.9b}{0.8w + t}\right)$$

Where:
- $b$: Total ground-to-ground dielectric thickness

---

## 2. Differential Pair Routing

Differential signaling (used by USB, LVDS, Ethernet, HDMI, PCIe) transmits complementary signals across two tightly coupled conductors ($D+$ and $D-$).

```tsx
<board width="50mm" height="30mm">
  {/* USB 90-Ohm Differential Trace */}
  <trace
    from="U1 .USB_DP"
    to="J1 .D_PLUS"
    width="0.25mm"
  />
  <trace
    from="U1 .USB_DM"
    to="J1 .D_MINUS"
    width="0.25mm"
  />
</board>
```

### Best Practices for Differential Signals:
1. **Constant Inter-Trace Spacing ($S$)**: Keep the gap between $D+$ and $D-$ constant along the entire route.
2. **Symmetrical Length Matching**: Skew between differential legs should remain within 0.15 mm (5 ps) to avoid common-mode noise.
3. **Continuous Reference Plane**: Never cross a split in the ground plane or change reference domains without adjacent ground return vias.
4. **Matched Via Transitions**: If a differential pair must switch layers, drop both vias together with a flanking ground via nearby for return current continuity.

---

## 3. High-Speed Decoupling & Power Integrity

Fast switching transceivers cause instantaneous $di/dt$ current surges. Without proper decoupling, supply rail voltage droop causes bit errors or system resets.

```tsx
<chip
  name="U1"
  footprint="qfn32"
  schPortArrangement={{
    leftSide: { pins: [1, 2, 3, 4] },
    rightSide: { pins: [5, 6, 7, 8] }
  }}
/>
{/* 100nF High-Frequency Ceramic Decoupling Capacitor Placed Immediately Adjacent */}
<capacitor
  name="C1"
  capacitance="100nF"
  footprint="0402"
  pcbX="12mm"
  pcbY="10mm"
/>
```

- **Loop Inductance**: Keep capacitor traces short and wide. Use 0402 or 0201 packages for minimum parasitic series inductance ($ESL$).
- **Via In Pad / Side Placement**: Position the capacitor between the IC supply pin and the ground plane via.

---

## 4. RF Grounding & Thermal Via Arrays

RF circuits (Wi-Fi, Bluetooth, Zigbee, LoRa) require low-impedance ground return paths and thermal dissipation:

1. **Via Stitching**: Place ground vias along board perimeters and RF ground zones at intervals $\le \lambda / 10$ (typically 1.0mm to 2.5mm apart).
2. **Solid Keepouts**: Ensure areas directly beneath chip antennas, baluns, and matching networks are cleared of all copper on all layers.
3. **Impedance Verification**: Use `getTraceWidthSummary` and `getThermalViaClusters` from `tscircuit` to inspect via arrays and trace geometry.
