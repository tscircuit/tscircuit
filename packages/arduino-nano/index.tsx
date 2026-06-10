import { createProject } from "@tscircuit/core";
import { ATmega328P } from "./components/ATmega328P";
import { CH340G } from "./components/CH340G";
import { PowerRegulator } from "./components/PowerRegulator";

export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    {/* Microcontroller */}
    <ATmega328P name="U1" pcbX="-8mm" pcbY="0mm" />

    {/* USB-UART Bridge */}
    <CH340G name="U2" pcbX="8mm" pcbY="0mm" />

    {/* Power Stage */}
    <PowerRegulator name="U3" pcbX="0mm" pcbY="6mm" />

    {/* Passive Components */}
    <resistor name="R1" resistance="10k" footprint="0402" pcbX="0mm" pcbY="5mm" /> {/* Reset Pull-up */}
    <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX="2mm" pcbY="5mm" /> {/* DTR Reset Cap */}
    <capacitor name="C2" capacitance="100nF" footprint="0402" pcbX="-2mm" pcbY="5mm" /> {/* Decoupling */}

    {/* Connect UART */}
    <trace from=".U2 > .TXD" to=".U1 > .PD0" />
    <trace from=".U2 > .RXD" to=".U1 > .PD1" />

    {/* Connect Reset */}
    <trace from=".U2 > .DTR" to=".C1 > .pin1" />
    <trace from=".C1 > .pin2" to=".U1 > .RESET" />
    <trace from=".R1 > .pin2" to=".U1 > .RESET" />

    {/* Connect Power */}
    <trace from=".U3 > .V5" to=".U1 > .VCC" />
    <trace from=".U3 > .V5" to=".U2 > .VCC" />
    <trace from=".R1 > .pin1" to=".U3 > .V5" />

    {/* Common Ground */}
    <net name="GND" />
    <trace from=".U1 > .GND" to="net.GND" />
    <trace from=".U2 > .GND" to="net.GND" />
    <trace from=".U3 > .GND" to="net.GND" />
  </board>
);

export default ArduinoNano;
