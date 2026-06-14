import React from "react"
import { ATmega328PCore } from "./components/ATmega328PCore"
import { CH340GSerial } from "./components/CH340GSerial"

export const ArduinoNanoV3 = () => (
  <board width="18mm" height="45mm">
    {/* === Core Modules === */}
    <ATmega328PCore name="MCU" />
    <CH340GSerial name="SERIAL" />

    {/* === Power Supply Section === */}

    {/* AMS1117-5.0 Voltage Regulator (SOT-223) */}
    <chip name="U3" footprint="sot223"
      pinLabels={{ pin1: "GND", pin2: "VOUT", pin3: "VIN", pin4: "VOUT2" }}
      pcbX="0mm" pcbY="-20mm"
    />

    {/* Schottky Diode — protects against reverse USB power */}
    <diode name="D1" footprint="sod123" pcbX="3mm" pcbY="-20mm" />

    {/* PTC Resettable Fuse — 500mA overcurrent protection */}
    <chip name="F1" footprint="1206"
      pinLabels={{ pin1: "IN", pin2: "OUT" }}
      pcbX="-3mm" pcbY="-20mm"
    />

    {/* Regulator input capacitor — 10µF smooths input voltage */}
    <capacitor name="C_REG_IN" capacitance="10uF" footprint="0805"
      pcbX="-2mm" pcbY="-22mm" />

    {/* Regulator output capacitor — 10µF stabilizes 5V output */}
    <capacitor name="C_REG_OUT" capacitance="10uF" footprint="0805"
      pcbX="2mm" pcbY="-22mm" />

    {/* Power LED (green) — shows board is powered */}
    <led name="LED_PWR" footprint="0805" pcbX="5mm" pcbY="-20mm" />
    <resistor name="R_PWR" resistance="1kohm" footprint="0805"
      pcbX="7mm" pcbY="-20mm" />

    {/* === Reset Switch === */}
    <chip name="SW1" footprint="tactile_switch_6x6mm"
      pinLabels={{ pin1: "A", pin2: "B" }}
      pcbX="-6mm" pcbY="5mm"
    />

    {/* === Pin Headers === */}

    {/* Left header — 15 pins */}
    <chip name="J1" footprint="pinrow15"
      pinLabels={{
        pin1: "D13", pin2: "3V3", pin3: "AREF",
        pin4: "A0", pin5: "A1", pin6: "A2", pin7: "A3",
        pin8: "A4", pin9: "A5", pin10: "A6", pin11: "A7",
        pin12: "5V", pin13: "RST", pin14: "GND", pin15: "VIN"
      }}
      pcbX="-9mm" pcbY="0mm"
    />

    {/* Right header — 15 pins */}
    <chip name="J2" footprint="pinrow15"
      pinLabels={{
        pin1: "D12", pin2: "D11", pin3: "D10", pin4: "D9",
        pin5: "D8", pin6: "D7", pin7: "D6", pin8: "D5",
        pin9: "D4", pin10: "D3", pin11: "D2", pin12: "GND2",
        pin13: "RST2", pin14: "RX", pin15: "TX"
      }}
      pcbX="9mm" pcbY="0mm"
    />

    {/* ICSP Header — 2x3 pins for in-circuit programming */}
    <chip name="J3" footprint="pinrow6"
      pinLabels={{
        pin1: "MISO", pin2: "VCC", pin3: "SCK",
        pin4: "MOSI", pin5: "RESET", pin6: "GND"
      }}
      pcbX="0mm" pcbY="8mm"
    />

    {/* ========================================= */}
    {/* ===  POWER SUPPLY TRACES  === */}
    {/* ========================================= */}

    {/* USB VBUS → Fuse → Diode → Regulator VIN */}
    <trace path={[".SERIAL .USB1 > .VBUS", ".F1 > .IN"]} />
    <trace path={[".F1 > .OUT", ".D1 > .anode"]} />
    <trace path={[".D1 > .cathode", ".U3 > .VIN"]} />

    {/* Regulator input capacitor */}
    <trace path={[".C_REG_IN > .pos", ".U3 > .VIN"]} />
    <trace path={[".C_REG_IN > .neg", ".U3 > .GND"]} />

    {/* Regulator output capacitor */}
    <trace path={[".C_REG_OUT > .pos", ".U3 > .VOUT"]} />
    <trace path={[".C_REG_OUT > .neg", ".U3 > .GND"]} />

    {/* Power LED: 5V → resistor → LED anode, LED cathode → GND */}
    <trace path={[".U3 > .VOUT", ".R_PWR > .left"]} />
    <trace path={[".R_PWR > .right", ".LED_PWR > .anode"]} />
    <trace path={[".LED_PWR > .cathode", ".U3 > .GND"]} />

    {/* ========================================= */}
    {/* ===  POWER → MCU TRACES  === */}
    {/* ========================================= */}

    {/* 5V rail to MCU VCC and AVCC */}
    <trace path={[".U3 > .VOUT", ".MCU .U1 > .VCC"]} />
    <trace path={[".U3 > .VOUT", ".MCU .U1 > .AVCC"]} />

    {/* GND from regulator to MCU GND */}
    <trace path={[".U3 > .GND", ".MCU .U1 > .GND"]} />

    {/* ========================================= */}
    {/* ===  SERIAL ↔ MCU TRACES  === */}
    {/* ========================================= */}

    {/* CH340G TXD → ATmega328P RXD (D0) */}
    <trace path={[".SERIAL .U2 > .TXD", ".MCU .U1 > .PD0_RXD"]} />

    {/* CH340G RXD → ATmega328P TXD (D1) */}
    <trace path={[".SERIAL .U2 > .RXD", ".MCU .U1 > .PD1_TXD"]} />

    {/* ========================================= */}
    {/* ===  AUTO-RESET TRACES  === */}
    {/* ========================================= */}

    {/* CH340G DTR → 100nF capacitor → MCU RESET */}
    <trace path={[".SERIAL .U2 > .DTR", ".SERIAL .C_RST > .pos"]} />
    <trace path={[".SERIAL .C_RST > .neg", ".MCU .U1 > .PC6_RESET"]} />

    {/* Reset Switch: pin A → MCU RESET, pin B → GND */}
    <trace path={[".SW1 > .A", ".MCU .U1 > .PC6_RESET"]} />
    <trace path={[".SW1 > .B", ".MCU .U1 > .GND"]} />

    {/* ========================================= */}
    {/* ===  HEADER → MCU DIGITAL PINS  === */}
    {/* ========================================= */}

    <trace path={[".J1 > .D13", ".MCU .U1 > .PB5_SCK"]} />
    <trace path={[".J2 > .D12", ".MCU .U1 > .PB4_MISO"]} />
    <trace path={[".J2 > .D11", ".MCU .U1 > .PB3_MOSI"]} />
    <trace path={[".J2 > .D10", ".MCU .U1 > .PB2"]} />
    <trace path={[".J2 > .D9", ".MCU .U1 > .PB1"]} />
    <trace path={[".J2 > .D8", ".MCU .U1 > .PB0"]} />
    <trace path={[".J2 > .D7", ".MCU .U1 > .PD7"]} />
    <trace path={[".J2 > .D6", ".MCU .U1 > .PD6"]} />
    <trace path={[".J2 > .D5", ".MCU .U1 > .PD5"]} />
    <trace path={[".J2 > .D4", ".MCU .U1 > .PD4"]} />
    <trace path={[".J2 > .D3", ".MCU .U1 > .PD3"]} />
    <trace path={[".J2 > .D2", ".MCU .U1 > .PD2"]} />
    <trace path={[".J2 > .TX", ".MCU .U1 > .PD1_TXD"]} />
    <trace path={[".J2 > .RX", ".MCU .U1 > .PD0_RXD"]} />

    {/* ========================================= */}
    {/* ===  HEADER → MCU ANALOG PINS  === */}
    {/* ========================================= */}

    <trace path={[".J1 > .A0", ".MCU .U1 > .PC0"]} />
    <trace path={[".J1 > .A1", ".MCU .U1 > .PC1"]} />
    <trace path={[".J1 > .A2", ".MCU .U1 > .PC2"]} />
    <trace path={[".J1 > .A3", ".MCU .U1 > .PC3"]} />
    <trace path={[".J1 > .A4", ".MCU .U1 > .PC4_SDA"]} />
    <trace path={[".J1 > .A5", ".MCU .U1 > .PC5_SCL"]} />
    <trace path={[".J1 > .A6", ".MCU .U1 > .ADC6"]} />
    <trace path={[".J1 > .A7", ".MCU .U1 > .ADC7"]} />

    {/* ========================================= */}
    {/* ===  HEADER → POWER RAILS  === */}
    {/* ========================================= */}

    <trace path={[".J1 > .5V", ".U3 > .VOUT"]} />
    <trace path={[".J1 > .GND", ".MCU .U1 > .GND"]} />
    <trace path={[".J1 > .VIN", ".U3 > .VIN"]} />
    <trace path={[".J1 > .RST", ".MCU .U1 > .PC6_RESET"]} />
    <trace path={[".J1 > .AREF", ".MCU .U1 > .AREF"]} />
    <trace path={[".J2 > .GND2", ".MCU .U1 > .GND"]} />

    {/* 3V3 from CH340G V3 pin */}
    <trace path={[".J1 > .3V3", ".SERIAL .U2 > .V3"]} />

    {/* ========================================= */}
    {/* ===  ICSP HEADER → MCU  === */}
    {/* ========================================= */}

    <trace path={[".J3 > .MISO", ".MCU .U1 > .PB4_MISO"]} />
    <trace path={[".J3 > .MOSI", ".MCU .U1 > .PB3_MOSI"]} />
    <trace path={[".J3 > .SCK", ".MCU .U1 > .PB5_SCK"]} />
    <trace path={[".J3 > .RESET", ".MCU .U1 > .PC6_RESET"]} />
    <trace path={[".J3 > .VCC", ".U3 > .VOUT"]} />
    <trace path={[".J3 > .GND", ".MCU .U1 > .GND"]} />
  </board>
)

export default ArduinoNanoV3
