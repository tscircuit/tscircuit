# Analog Simulation & SPICE Guide

**tscircuit** includes native support for analog circuit simulation, allowing engineers to verify schematic functionality, transient step responses, and frequency characteristics directly from React JSX definitions.

---

## 1. How Simulation Works

```
+-------------------------------------------------------------+
|                      React JSX Circuit                      |
|       (<resistor>, <capacitor>, <voltagesource>, etc.)      |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               Circuit JSON Intermediate Format              |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  circuit-json-to-spice                      |
|                  (Standard SPICE netlist)                   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              ngspice WebAssembly Engine                     |
|           (@tscircuit/ngspice-spice-engine)                 |
|       Transient waveforms, Bode plots, DC operating pts     |
+-------------------------------------------------------------+
```

---

## 2. Example: RC Low-Pass Filter

Here is a complete simulation example defining a 1kHz RC low-pass filter:

```tsx
import { Circuit } from "tscircuit"

export const RcFilter = () => {
  return (
    <board width="30mm" height="30mm">
      {/* 5V AC/Pulse Voltage Source */}
      <voltagesource
        name="V1"
        voltage="5V"
        waveform="pulse"
        frequency="1kHz"
      />

      {/* 1k Ohm Resistor */}
      <resistor name="R1" resistance="1k" footprint="0805" />

      {/* 100nF Capacitor (fc ≈ 1.59kHz) */}
      <capacitor name="C1" capacitance="100nF" footprint="0805" />

      {/* Connectivity */}
      <trace from=".V1 > .pos" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".C1 > .pin1" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".V1 > .neg" to="net.GND" />

      {/* Output Probe */}
      <voltageprobe from=".C1 > .pin1" name="Vout" />
    </board>
  )
}
```

---

## 3. Analysis Modes

tscircuit supports the core SPICE analysis types:

### 3.1 Transient Analysis (`.tran`)
Computes time-domain waveform voltages and currents as components charge and discharge:
- Step response and rise/fall times
- RC/LC ringing and oscillation damping
- Switching noise and decoupling efficacy

### 3.2 AC Frequency Sweep (`.ac`)
Sweeps frequency across logarithmic decades to produce Bode magnitude and phase plots:
- Filter cutoff frequencies ($f_c = \frac{1}{2\pi R C}$)
- Op-amp bandwidth and phase margins

### 3.3 DC Operating Point (`.op`)
Computes quiescent bias voltages and currents at steady state without AC signals.

---

## 4. Running Simulations via CLI & Web

- **Web Playground:** Open any circuit in the tscircuit web editor and click the **Simulate** tab to run real-time transient graphs.
- **CLI Simulation:** Run `tsci sim` inside your project directory to execute headless ngspice simulations and plot waveforms directly.
