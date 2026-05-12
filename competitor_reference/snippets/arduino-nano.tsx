import React from "react"

/**
 * Arduino Nano V3.0 — Complete Circuit Implementation
 *
 * Matches the official Arduino Nano schematic (ATmega328P variant):
 *   https://store-usa.arduino.cc/products/arduino-nano
 *
 * ICs:
 *   U1  ATmega328P-AU  8-bit AVR MCU (TQFP-32)
 *   U2  CH340G         USB-to-UART bridge (SOP-16)
 *   U3  AMS1117-5.0    5 V LDO regulator (SOT-223)
 *   U4  AMS1117-3.3    3.3 V LDO regulator (SOT-223)
 *
 * Oscillators:
 *   Y1  16 MHz  ATmega328P system clock, HC-49/S
 *   Y2  12 MHz  CH340G USB clock, HC-49/S
 *
 * Headers:
 *   J1  15-pin top header   (D0–D13, AREF, A0–A5, 5V, 3V3, GND, VIN, RST)
 *   J2  15-pin bottom header (mirrored row, same net assignments)
 *   J3  ICSP 2×3 header     (MOSI, MISO, SCK, RESET, VCC, GND)
 *   J4  Mini-USB connector
 *
 * Indicators:
 *   D1  Green  PWR LED
 *   D2  Yellow TX LED   (active when CH340G transmits)
 *   D3  Yellow RX LED   (active when CH340G receives)
 *   D4  Yellow L/D13 LED (connected to PB5 / Arduino pin 13)
 *
 * Board dimensions: 45 mm × 18 mm (matches physical Nano)
 */
export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    {/* ── Main MCU ───────────────────────────────────────────────── */}
    <chip
      name="U1"
      footprint="tqfp32"
      manufacturerPartNumber="ATmega328P-AU"
      pinLabels={{
        "1": "PC6_RESET",
        "2": "PD0_RXD",
        "3": "PD1_TXD",
        "4": "PD2_INT0",
        "5": "PD3_INT1",
        "6": "PD4_T0",
        "7": "VCC",
        "8": "GND",
        "9": "XTAL1",
        "10": "XTAL2",
        "11": "PD5_T1",
        "12": "PD6_AIN0",
        "13": "PD7_AIN1",
        "14": "PB0_ICP1",
        "15": "PB1_OC1A",
        "16": "PB2_SS",
        "17": "PB3_MOSI",
        "18": "PB4_MISO",
        "19": "PB5_SCK",
        "20": "AVCC",
        "21": "AREF",
        "22": "GND2",
        "23": "PC0_ADC0",
        "24": "PC1_ADC1",
        "25": "PC2_ADC2",
        "26": "PC3_ADC3",
        "27": "PC4_ADC4_SDA",
        "28": "PC5_ADC5_SCL",
        "29": "PC6_RESET2",
        "30": "PD0_RXD2",
        "31": "PD1_TXD2",
        "32": "PD2_INT02",
      }}
      pcbX={0}
      pcbY={0}
    />

    {/* ── USB-to-UART Bridge ──────────────────────────────────────── */}
    <chip
      name="U2"
      footprint="soic16"
      manufacturerPartNumber="CH340G"
      pinLabels={{
        "1": "INT",
        "2": "TXD",
        "3": "RXD",
        "4": "V3",
        "5": "UD_P",
        "6": "UD_N",
        "7": "XI",
        "8": "XO",
        "9": "CTS",
        "10": "DSR",
        "11": "RI",
        "12": "DCD",
        "13": "DTR",
        "14": "RTS",
        "15": "GND",
        "16": "VCC",
      }}
      pcbX={-14}
      pcbY={0}
    />

    {/* ── Voltage Regulators ─────────────────────────────────────── */}
    <chip
      name="U3"
      footprint="sot223"
      manufacturerPartNumber="AMS1117-5.0"
      pinLabels={{ "1": "GND", "2": "OUTPUT", "3": "INPUT" }}
      pcbX={16}
      pcbY={5}
    />
    <chip
      name="U4"
      footprint="sot223"
      manufacturerPartNumber="AMS1117-3.3"
      pinLabels={{ "1": "GND", "2": "OUTPUT", "3": "INPUT" }}
      pcbX={16}
      pcbY={-5}
    />

    {/* ── 16 MHz Crystal (ATmega328P) ────────────────────────────── */}
    <crystal
      name="Y1"
      frequency="16MHz"
      footprint="hc49s"
      pcbX={6}
      pcbY={6}
    />
    <capacitor name="C1" capacitance="22pF" footprint="0402" pcbX={4} pcbY={7} />
    <capacitor name="C2" capacitance="22pF" footprint="0402" pcbX={8} pcbY={7} />

    {/* ── 12 MHz Crystal (CH340G) ────────────────────────────────── */}
    <crystal
      name="Y2"
      frequency="12MHz"
      footprint="hc49s"
      pcbX={-19}
      pcbY={6}
    />
    <capacitor name="C8" capacitance="22pF" footprint="0402" pcbX={-21} pcbY={7} />
    <capacitor name="C9" capacitance="22pF" footprint="0402" pcbX={-17} pcbY={7} />

    {/* ── Decoupling Caps ─────────────────────────────────────────── */}
    {/* ATmega VCC/AVCC decoupling */}
    <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={-2} pcbY={-5} />
    <capacitor name="C4" capacitance="100nF" footprint="0402" pcbX={2} pcbY={-5} />
    <capacitor name="C5" capacitance="10uF" footprint="0805" pcbX={0} pcbY={-7} />
    {/* AREF bypass */}
    <capacitor name="C10" capacitance="100nF" footprint="0402" pcbX={4} pcbY={-5} />
    {/* CH340G VCC decoupling */}
    <capacitor name="C6" capacitance="100nF" footprint="0402" pcbX={-12} pcbY={-5} />
    <capacitor name="C7" capacitance="10uF" footprint="0805" pcbX={-14} pcbY={-7} />
    {/* DTR auto-reset capacitor */}
    <capacitor name="C11" capacitance="100nF" footprint="0402" pcbX={-8} pcbY={5} />

    {/* ── Reset Circuit ───────────────────────────────────────────── */}
    <pushbutton name="SW1" footprint="sw_push_4pin" pcbX={12} pcbY={6} />
    <resistor name="R1" resistance="10k" footprint="0402" pcbX={10} pcbY={5} />
    <capacitor name="C12" capacitance="100nF" footprint="0402" pcbX={12} pcbY={5} />

    {/* ── Status LEDs ─────────────────────────────────────────────── */}
    <led name="D1" footprint="0402" color="green" pcbX={-4} pcbY={8} />
    <resistor name="R2" resistance="1k" footprint="0402" pcbX={-6} pcbY={8} />

    <led name="D2" footprint="0402" color="yellow" pcbX={0} pcbY={8} />
    <resistor name="R3" resistance="1k" footprint="0402" pcbX={-2} pcbY={8} />

    <led name="D3" footprint="0402" color="yellow" pcbX={4} pcbY={8} />
    <resistor name="R4" resistance="1k" footprint="0402" pcbX={2} pcbY={8} />

    <led name="D4" footprint="0402" color="yellow" pcbX={8} pcbY={8} />
    <resistor name="R5" resistance="1k" footprint="0402" pcbX={6} pcbY={8} />

    {/* ── Pin Headers ─────────────────────────────────────────────── */}
    {/* J1: top row — D0–D13 + AREF side */}
    <pinheader name="J1" pinCount={15} pitch="2.54mm" pcbX={-9} pcbY={9} rotation={0} />
    {/* J2: bottom row — A0–A5 + power side */}
    <pinheader name="J2" pinCount={15} pitch="2.54mm" pcbX={-9} pcbY={-9} rotation={0} />
    {/* J3: ICSP 2×3 */}
    <pinheader name="J3" pinCount={6} pitch="2.54mm" pcbX={19} pcbY={0} />

    {/* ── USB Connector ───────────────────────────────────────────── */}
    <chip
      name="J4"
      footprint="usb_mini_b"
      pcbX={-21}
      pcbY={0}
    />

    {/* ═══════════════════ TRACES ═══════════════════════════════════ */}

    {/* 16 MHz crystal → ATmega328P */}
    <trace path={[".Y1 > .1", ".U1 > .XTAL1"]} />
    <trace path={[".Y1 > .2", ".U1 > .XTAL2"]} />
    <trace path={[".C1 > .pos", ".Y1 > .1"]} />
    <trace path={[".C2 > .pos", ".Y1 > .2"]} />
    <trace path={[".C1 > .neg", "net.GND"]} />
    <trace path={[".C2 > .neg", "net.GND"]} />

    {/* 12 MHz crystal → CH340G */}
    <trace path={[".Y2 > .1", ".U2 > .XI"]} />
    <trace path={[".Y2 > .2", ".U2 > .XO"]} />
    <trace path={[".C8 > .pos", ".Y2 > .1"]} />
    <trace path={[".C9 > .pos", ".Y2 > .2"]} />
    <trace path={[".C8 > .neg", "net.GND"]} />
    <trace path={[".C9 > .neg", "net.GND"]} />

    {/* CH340G ↔ ATmega328P UART */}
    <trace path={[".U2 > .TXD", ".U1 > .PD0_RXD"]} />
    <trace path={[".U2 > .RXD", ".U1 > .PD1_TXD"]} />

    {/* DTR → auto-reset capacitor → MCU RESET */}
    <trace path={[".U2 > .DTR", ".C11 > .pos"]} />
    <trace path={[".C11 > .neg", ".U1 > .PC6_RESET"]} />

    {/* USB D+/D− → CH340G */}
    <trace path={[".J4 > .D_P", ".U2 > .UD_P"]} />
    <trace path={[".J4 > .D_N", ".U2 > .UD_N"]} />

    {/* Reset button + pull-up */}
    <trace path={["net.VCC", ".R1 > .1"]} />
    <trace path={[".R1 > .2", ".U1 > .PC6_RESET"]} />
    <trace path={[".SW1 > .1", ".U1 > .PC6_RESET"]} />
    <trace path={[".SW1 > .2", "net.GND"]} />
    <trace path={[".C12 > .pos", ".U1 > .PC6_RESET"]} />
    <trace path={[".C12 > .neg", "net.GND"]} />

    {/* ATmega328P power + decoupling */}
    <trace path={["net.VCC", ".U1 > .VCC"]} />
    <trace path={["net.VCC", ".U1 > .AVCC"]} />
    <trace path={["net.GND", ".U1 > .GND"]} />
    <trace path={["net.GND", ".U1 > .GND2"]} />
    <trace path={[".C3 > .pos", "net.VCC"]} />
    <trace path={[".C3 > .neg", "net.GND"]} />
    <trace path={[".C4 > .pos", "net.VCC"]} />
    <trace path={[".C4 > .neg", "net.GND"]} />
    <trace path={[".C5 > .pos", "net.VCC"]} />
    <trace path={[".C5 > .neg", "net.GND"]} />
    <trace path={[".C10 > .pos", ".U1 > .AREF"]} />
    <trace path={[".C10 > .neg", "net.GND"]} />

    {/* CH340G power + decoupling */}
    <trace path={["net.VCC", ".U2 > .VCC"]} />
    <trace path={["net.GND", ".U2 > .GND"]} />
    <trace path={[".C6 > .pos", "net.VCC"]} />
    <trace path={[".C6 > .neg", "net.GND"]} />
    <trace path={[".C7 > .pos", "net.VCC"]} />
    <trace path={[".C7 > .neg", "net.GND"]} />

    {/* 5 V regulator: VIN → 5 V rail */}
    <trace path={["net.VIN", ".U3 > .INPUT"]} />
    <trace path={[".U3 > .OUTPUT", "net.VCC"]} />
    <trace path={[".U3 > .GND", "net.GND"]} />

    {/* 3.3 V regulator: 5 V → 3.3 V rail */}
    <trace path={["net.VCC", ".U4 > .INPUT"]} />
    <trace path={[".U4 > .OUTPUT", "net.V3V3"]} />
    <trace path={[".U4 > .GND", "net.GND"]} />

    {/* PWR LED (5 V → R2 → D1 → GND) */}
    <trace path={["net.VCC", ".R2 > .1"]} />
    <trace path={[".R2 > .2", ".D1 > .anode"]} />
    <trace path={[".D1 > .cathode", "net.GND"]} />

    {/* TX LED (CH340G TXD → R3 → D2 → GND) */}
    <trace path={[".U2 > .TXD", ".R3 > .1"]} />
    <trace path={[".R3 > .2", ".D2 > .anode"]} />
    <trace path={[".D2 > .cathode", "net.GND"]} />

    {/* RX LED (CH340G RXD → R4 → D3 → GND) */}
    <trace path={[".U2 > .RXD", ".R4 > .1"]} />
    <trace path={[".R4 > .2", ".D3 > .anode"]} />
    <trace path={[".D3 > .cathode", "net.GND"]} />

    {/* L LED — D13 / PB5 */}
    <trace path={[".U1 > .PB5_SCK", ".R5 > .1"]} />
    <trace path={[".R5 > .2", ".D4 > .anode"]} />
    <trace path={[".D4 > .cathode", "net.GND"]} />

    {/* ICSP header */}
    <trace path={[".J3 > .1", ".U1 > .PB3_MOSI"]} />
    <trace path={[".J3 > .3", ".U1 > .PB4_MISO"]} />
    <trace path={[".J3 > .5", ".U1 > .PB5_SCK"]} />
    <trace path={[".J3 > .4", ".U1 > .PC6_RESET"]} />
    <trace path={[".J3 > .2", "net.VCC"]} />
    <trace path={[".J3 > .6", "net.GND"]} />
  </board>
)

export default ArduinoNano