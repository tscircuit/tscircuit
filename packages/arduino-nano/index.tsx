import { createProject } from "@tscircuit/core";
import { ATmega328P } from "./components/ATmega328P";
import { CH340G } from "./components/CH340G";
import { PowerRegulator } from "./components/PowerRegulator";

export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    {/* Microcontroller */}
    <ATmega328P name="U1" center={[-8, 0]} />

    {/* USB-UART Bridge */}
    <CH340G name="U2" center={[8, 0]} />

    {/* Power Stage */}
    <PowerRegulator name="U3" center={[0, 6]} />

    {/* Crystals */}
    <chip name="Y1" footprint="hc49" center={[-15, 0]} pinLabels={{ pin1: "1", pin2: "2" }} /> {/* 16MHz MCU */}
    <chip name="Y2" footprint="hc49" center={[15, 0]} pinLabels={{ pin1: "1", pin2: "2" }} />  {/* 12MHz CH340G */}

    {/* LEDs */}
    <chip name="L1" footprint="0603" center={[-2, -5]} pinLabels={{ pin1: "A", pin2: "K" }} /> {/* PWR */}
    <chip name="L2" footprint="0603" center={[0, -5]} pinLabels={{ pin1: "A", pin2: "K" }} />  {/* TX */}
    <chip name="L3" footprint="0603" center={[2, -5]} pinLabels={{ pin1: "A", pin2: "K" }} />  {/* RX */}

    {/* Passive Components */}
    <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={5} /> {/* Reset Pull-up */}
    <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={2} pcbY={5} /> {/* DTR Reset Cap */}
    <capacitor name="C2" capacitance="100nF" footprint="0402" pcbX={-2} pcbY={5} /> {/* Decoupling */}
    <resistor name="R2" resistance="1k" footprint="0402" pcbX={-4} pcbY={5} /> {/* LED Resistor */}

    {/* Connect UART */}
    <trace from=".U2 > .TXD" to=".U1 > .PD0" />
    <trace from=".U2 > .RXD" to=".U1 > .PD1" />

    {/* Connect Reset */}
    <trace from=".U2 > .DTR" to=".C1 > .pin1" />
    <trace from=".C1 > .pin2" to=".U1 > .PC6" />
    <trace from=".R1 > .pin2" to=".U1 > .PC6" />

    {/* Connect Power */}
    <trace from=".U3 > .V5" to=".U1 > .VCC" />
    <trace from=".U3 > .V5" to=".U2 > .VCC" />
    <trace from=".R1 > .pin1" to=".U3 > .V5" />

    {/* Common Ground */}
    <net name="GND" />
    <trace from=".U1 > .GND" to="net.GND" />
    <trace from=".U2 > .GND" to="net.GND" />
    <trace from=".U3 > .GND" to="net.GND" />
    <trace from=".L1 > .K" to="net.GND" />
  </board>
);

export default ArduinoNano;
