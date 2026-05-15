
import { Board, Chip, Resistor, Capacitor, Crystal } from "@tscircuit/core"

export const ArduinoNano = () => (
  <board name="Arduino Nano" width={18} height={43}>
    {/* AMS1117-5.0 Regulator */}
    <chip name="U3" footprint="sot223" partNumber="AMS1117-5.0" pcbX={9} pcbY={38} />
    <capacitor name="C1" capacitance="10uF" pcbX={12} pcbY={36} />
    <capacitor name="C2" capacitance="100nF" pcbX={6} pcbY={36} />

    {/* AMS1117-3.3 Regulator */}
    <chip name="U4" footprint="sot223" partNumber="AMS1117-3.3" pcbX={9} pcbY={32} />
    <capacitor name="C3" capacitance="10uF" pcbX={12} pcbY={30} />
    <capacitor name="C4" capacitance="100nF" pcbX={6} pcbY={30} />

    {/* ATmega328P Main MCU */}
    <chip name="U1" footprint="tqfp32" partNumber="ATmega328P" pcbX={9} pcbY={20} />
    <capacitor name="C5" capacitance="100nF" pcbX={13} pcbY={22} />
    <capacitor name="C6" capacitance="100nF" pcbX={5} pcbY={18} />

    {/* 16MHz Crystal */}
    <crystal name="Y1" frequency="16MHz" pcbX={4} pcbY={15} />
    <capacitor name="C7" capacitance="22pF" pcbX={2} pcbY={13} />
    <capacitor name="C8" capacitance="22pF" pcbX={2} pcbY={17} />

    {/* Reset */}
    <resistor name="R1" resistance="10k" pcbX={4} pcbY={8} />

    {/* CH340G USB-to-Serial */}
    <chip name="U2" footprint="soic16" partNumber="CH340G" pcbX={9} pcbY={5} />
    <capacitor name="C9" capacitance="100nF" pcbX={12} pcbY={3} />
    <crystal name="Y2" frequency="12MHz" pcbX={6} pcbY={3} />
    <capacitor name="C10" capacitance="22pF" pcbX={4} pcbY={1} />
    <capacitor name="C11" capacitance="22pF" pcbX={8} pcbY={1} />

    {/* Crystal connections */}
    <trace from="U1.9" to="Y1.pin1" />
    <trace from="U1.10" to="Y1.pin2" />
    <trace from="Y1.pin1" to="C7.pin1" />
    <trace from="C7.pin2" to="GND" />
    <trace from="Y1.pin2" to="C8.pin1" />
    <trace from="C8.pin2" to="GND" />

    {/* Reset pull-up */}
    <trace from="U1.1" to="R1.pin1" />
    <trace from="R1.pin2" to="5V" />

    {/* UART */}
    <trace from="U2.5" to="U1.2" />
    <trace from="U2.6" to="U1.3" />

    {/* Power tree */}
    <trace from="U3.VOUT" to="5V" />
    <trace from="U4.VOUT" to="3V3" />
    <trace from="U1.7" to="5V" />
    <trace from="U1.20" to="5V" />
    <trace from="U1.8" to="GND" />
    <trace from="U1.22" to="GND" />
    <trace from="C1.pin2" to="GND" />
    <trace from="C2.pin2" to="GND" />
    <trace from="C3.pin2" to="GND" />
    <trace from="C4.pin2" to="GND" />
    <trace from="C5.pin2" to="GND" />
    <trace from="C6.pin2" to="GND" />
    <trace from="C9.pin2" to="GND" />
    <trace from="C10.pin2" to="GND" />
    <trace from="C11.pin2" to="GND" />
  </board>
)

export default ArduinoNano
