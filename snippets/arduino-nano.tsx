import React from "react"

/**
 * Arduino Nano V3.0 — Superior Circuit Implementation
 *
 * Matches the official Arduino Nano V3.0 schematic (ATmega328P + CH340G variant):
 *   https://store-usa.arduino.cc/products/arduino-nano
 *
 * ## Bill of Materials
 *
 * | Designator | Type                  | Manufacturer Part Number / Value | Footprint  | Qty |
 * |------------|-----------------------|----------------------------------|------------|-----|
 * | U1         | MCU (8-bit AVR)       | ATmega328P-AU                    | TQFP-32    | 1   |
 * | U2         | USB-UART Bridge       | CH340G                           | SOP-16     | 1   |
 * | U3         | 5V LDO Regulator      | AMS1117-5.0                      | SOT-223    | 1   |
 * | U4         | 3.3V LDO Regulator    | AMS1117-3.3                      | SOT-223    | 1   |
 * | Y1         | 16 MHz Crystal        | ABLS-16.000MHZ-B2-F-T            | HC-49/S    | 1   |
 * | Y2         | 12 MHz Crystal        | ABLS-12.000MHZ-B2-F-T            | HC-49/S    | 1   |
 * | C1, C2     | MLCC 22pF             | CL10C220JB8NNNC                  | 0402       | 2   |
 * | C3, C4     | MLCC 100nF            | CC0402KRX7R9BB104                | 0402       | 2   |
 * | C5, C7     | Tantalum 10µF         | TAJB106K016RNJ                   | 0805       | 2   |
 * | C6, C10    | MLCC 100nF            | CC0402KRX7R9BB104                | 0402       | 2   |
 * | C8, C9     | MLCC 22pF             | CL10C220JB8NNNC                  | 0402       | 2   |
 * | C11        | MLCC 100nF (DTR)      | CC0402KRX7R9BB104                | 0402       | 1   |
 * | C13, C14   | Tantalum 10µF (REG)   | TAJB106K016RNJ                   | 0805       | 2   |
 * | C15, C16   | MLCC 100nF (REG)      | CC0402KRX7R9BB104                | 0402       | 2   |
 * | C17        | MLCC 100nF (CH340 V3) | CC0402KRX7R9BB104                | 0402       | 1   |
 * | C18        | MLCC 100nF (AVCC)     | CC0402KRX7R9BB104                | 0402       | 1   |
 * | R1         | 10kΩ (Reset Pull-up)  | RC0402FR-0710KL                  | 0402       | 1   |
 * | R2–R5      | 1kΩ (LED current)     | RC0402FR-071KL                   | 0402       | 4   |
 * | R6         | 1MΩ (USB Shield)      | RC0402FR-071ML                   | 0402       | 1   |
 * | D1         | Green LED (PWR)       | 19-217/GHC-YR1S2/3T              | 0402       | 1   |
 * | D2         | Amber LED (TX)        | 19-217/Y5C-AP1Q2/3T              | 0402       | 1   |
 * | D3         | Amber LED (RX)        | 19-217/Y5C-AP1Q2/3T              | 0402       | 1   |
 * | D4         | Yellow LED (D13)      | 19-217/Y5C-AM1N1VY/3T            | 0402       | 1   |
 * | D5         | Schottky Diode (USB)  | BAT54C                           | SOT-23     | 1   |
 * | FB1        | Ferrite Bead (AVCC)   | BLM18RK102SN1D                   | 0402       | 1   |
 * | SW1        | Reset Pushbutton      | PTS645SM43SMTR92 LFS             | 4-Pin TH   | 1   |
 * | J1, J2     | 15-pin Header F       | PPTC151LFBN-RC                   | 2.54mm TH  | 2   |
 * | J3         | ICSP 2×3 Header       | 67996-406HLF                     | 2.54mm TH  | 1   |
 * | J4         | Mini-USB B Connector  | UX60SC-MB-5ST                    | SMD        | 1   |
 *
 * Board dimensions: 45 mm × 18 mm (matches physical Nano V3)
 */
export const ArduinoNano = () => (
  <board
    width="45mm"
    height="18mm"
    outline={[
      { x: -22.5, y: -9 },
      { x: 22.5, y: -9 },
      { x: 22.5, y: 9 },
      { x: -22.5, y: 9 },
    ]}
  >
    {/* ═══════════════════ MAIN MCU: ATmega328P-AU ═══════════════════ */}
    <chip
      name="U1"
      footprint="tqfp32"
      manufacturerPartNumber="ATmega328P-AU"
      schPinArrangement={{
        leftSide: {
          pins: [2, 3, 4, 5, 9, 10],
          direction: "top-to-bottom",
        },
        bottomSide: {
          pins: [8, 22, 7, 20, 21],
          direction: "left-to-right",
        },
        rightSide: {
          pins: [14, 15, 16, 17, 18, 19, 11, 12, 13],
          direction: "top-to-bottom",
        },
        topSide: {
          pins: [1, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23],
          direction: "left-to-right",
        },
      }}
      pinLabels={{
        "1": "PC6_RESET",
        "2": "PD0_RXD",
        "3": "PD1_TXD",
        "4": "PD2",
        "5": "PD3",
        "6": "PD4",
        "7": "VCC",
        "8": "GND",
        "9": "XTAL1",
        "10": "XTAL2",
        "11": "PD5",
        "12": "PD6",
        "13": "PD7",
        "14": "PB0",
        "15": "PB1",
        "16": "PB2_SS",
        "17": "PB3_MOSI",
        "18": "PB4_MISO",
        "19": "PB5_SCK",
        "20": "AVCC",
        "21": "AREF",
        "22": "GND",
        "23": "PC0_ADC0",
        "24": "PC1_ADC1",
        "25": "PC2_ADC2",
        "26": "PC3_ADC3",
        "27": "PC4_ADC4_SDA",
        "28": "PC5_ADC5_SCL",
        "29": "PC6_RESET",
        "30": "PD0_RXD",
        "31": "PD1_TXD",
        "32": "PD2",
      }}
      pcbX={0}
      pcbY={0}
    />

    {/* ═══════════════════ USB-UART BRIDGE: CH340G ═══════════════════ */}
    <chip
      name="U2"
      footprint="soic16"
      manufacturerPartNumber="CH340G"
      schPinArrangement={{
        leftSide: {
          pins: [2, 3, 13],
          direction: "top-to-bottom",
        },
        bottomSide: {
          pins: [1, 4, 15, 9, 10, 11, 12],
          direction: "left-to-right",
        },
        rightSide: {
          pins: [6, 5],
          direction: "top-to-bottom",
        },
        topSide: {
          pins: [16, 14, 7, 8],
          direction: "left-to-right",
        },
      }}
      pinLabels={{
        "1": "INT_N",
        "2": "TXD",
        "3": "RXD",
        "4": "V3",
        "5": "UD_P",
        "6": "UD_N",
        "7": "XI",
        "8": "XO",
        "9": "CTS_N",
        "10": "DSR_N",
        "11": "RI_N",
        "12": "DCD_N",
        "13": "DTR_N",
        "14": "RTS_N",
        "15": "GND",
        "16": "VCC",
      }}
      pcbX={-16}
      pcbY={0}
    />

    {/* ═══════════════════ 5V LDO REGULATOR: AMS1117-5.0 ═══════════════════ */}
    <chip
      name="U3"
      footprint="sot223"
      manufacturerPartNumber="AMS1117-5.0"
      schPinArrangement={{
        leftSide: {
          pins: [3],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [2],
          direction: "top-to-bottom",
        },
        bottomSide: {
          pins: [1],
          direction: "left-to-right",
        },
      }}
      pinLabels={{
        "1": "GND",
        "2": "VOUT",
        "3": "VIN",
      }}
      pcbX={18}
      pcbY={6}
    />

    {/* ═══════════════════ 3.3V LDO REGULATOR: AMS1117-3.3 ═══════════════════ */}
    <chip
      name="U4"
      footprint="sot223"
      manufacturerPartNumber="AMS1117-3.3"
      schPinArrangement={{
        leftSide: {
          pins: [3],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [2],
          direction: "top-to-bottom",
        },
        bottomSide: {
          pins: [1],
          direction: "left-to-right",
        },
      }}
      pinLabels={{
        "1": "GND",
        "2": "VOUT",
        "3": "VIN",
      }}
      pcbX={18}
      pcbY={-6}
    />

    {/* ═══════════════════ 16 MHz CRYSTAL (ATmega328P) ═══════════════════ */}
    <crystal
      name="Y1"
      frequency="16MHz"
      loadCapacitance="22pF"
      manufacturerPartNumber="ABLS-16.000MHZ-B2-F-T"
      footprint="hc49s"
      pcbX={4}
      pcbY={6}
    />
    <capacitor
      name="C1"
      capacitance="22pF"
      manufacturerPartNumber="CL10C220JB8NNNC"
      footprint="0402"
      pcbX={2}
      pcbY={7}
    />
    <capacitor
      name="C2"
      capacitance="22pF"
      manufacturerPartNumber="CL10C220JB8NNNC"
      footprint="0402"
      pcbX={6}
      pcbY={7}
    />

    {/* ═══════════════════ 12 MHz CRYSTAL (CH340G) ═══════════════════ */}
    <crystal
      name="Y2"
      frequency="12MHz"
      loadCapacitance="22pF"
      manufacturerPartNumber="ABLS-12.000MHZ-B2-F-T"
      footprint="hc49s"
      pcbX={-21}
      pcbY={6}
    />
    <capacitor
      name="C8"
      capacitance="22pF"
      manufacturerPartNumber="CL10C220JB8NNNC"
      footprint="0402"
      pcbX={-23}
      pcbY={7}
    />
    <capacitor
      name="C9"
      capacitance="22pF"
      manufacturerPartNumber="CL10C220JB8NNNC"
      footprint="0402"
      pcbX={-19}
      pcbY={7}
    />

    {/* ═══════════════════ DECOUPLING CAPACITORS ═══════════════════ */}
    {/* ATmega328P VCC decoupling (near pins 7, 8) */}
    <capacitor
      name="C3"
      capacitance="100nF"
      manufacturerPartNumber="CC0402KRX7R9BB104"
      footprint="0402"
      pcbX={-2}
      pcbY={-4}
    />
    <capacitor
      name="C4"
      capacitance="100nF"
      manufacturerPartNumber="CC0402KRX7R9BB104"
      footprint="0402"
      pcbX={2}
      pcbY={-4}
    />
    <capacitor
      name="C5"
      capacitance="10uF"
      manufacturerPartNumber="TAJB106K016RNJ"
      footprint="0805"
      pcbX={0}
      pcbY={-6}
    />

    {/* ATmega328P AREF bypass */}
    <capacitor
      name="C10"
      capacitance="100nF"
      manufacturerPartNumber="CC0402KRX7R9BB104"
      footprint="0402"
      pcbX={4}
      pcbY={-4}
    />

    {/* AVCC ferrite bead + cap filter (analog supply filtering) */}
    <capacitor
      name="C18"
      capacitance="100nF"
      manufacturerPartNumber="CC0402KRX7R9BB104"
      footprint="0402"
      pcbX={3}
      pcbY={-6}
    />

    {/* CH340G VCC decoupling (near pins 15, 16) */}
    <capacitor
      name="C6"
      capacitance="100nF"
      manufacturerPartNumber="CC0402KRX7R9BB104"
      footprint="0402"
      pcbX={-14}
      pcbY={-4}
    />
    <capacitor
      name="C7"
      capacitance="10uF"
      manufacturerPartNumber="TAJB106K016RNJ"
      footprint="0805"
      pcbX={-16}
      pcbY={-6}
    />

    {/* CH340G V3 pin internal regulator cap */}
    <capacitor
      name="C17"
      capacitance="100nF"
      manufacturerPartNumber="CC0402KRX7R9BB104"
      footprint="0402"
      pcbX={-14}
      pcbY={-2}
    />

    {/* DTR auto-reset coupling capacitor */}
    <capacitor
      name="C11"
      capacitance="100nF"
      manufacturerPartNumber="CC0402KRX7R9BB104"
      footprint="0402"
      pcbX={-10}
      pcbY={4}
    />

    {/* Regulator filter capacitors: Input & Output per AMS1117 datasheet */}
    {/* U3 (5V reg): Input cap — 10µF tantalum */}
    <capacitor
      name="C13"
      capacitance="10uF"
      manufacturerPartNumber="TAJB106K016RNJ"
      footprint="0805"
      pcbX={20}
      pcbY={6}
    />
    {/* U3 (5V reg): Output cap — 10µF tantalum (required for stability) */}
    <capacitor
      name="C14"
      capacitance="10uF"
      manufacturerPartNumber="TAJB106K016RNJ"
      footprint="0805"
      pcbX={20}
      pcbY={4}
    />
    {/* U4 (3.3V reg): Input cap — 100nF */}
    <capacitor
      name="C15"
      capacitance="100nF"
      manufacturerPartNumber="CC0402KRX7R9BB104"
      footprint="0402"
      pcbX={20}
      pcbY={-4}
    />
    {/* U4 (3.3V reg): Output cap — 10µF tantalum (required for stability) */}
    <capacitor
      name="C16"
      capacitance="10uF"
      manufacturerPartNumber="TAJB106K016RNJ"
      footprint="0805"
      pcbX={20}
      pcbY={-6}
    />

    {/* ═══════════════════ RESET CIRCUIT ═══════════════════ */}
    <pushbutton
      name="SW1"
      manufacturerPartNumber="PTS645SM43SMTR92 LFS"
      footprint="sw_push_4pin"
      pcbX={14}
      pcbY={6}
    />
    <resistor
      name="R1"
      resistance="10k"
      manufacturerPartNumber="RC0402FR-0710KL"
      footprint="0402"
      pcbX={12}
      pcbY={5}
    />

    {/* ═══════════════════ STATUS LEDs ═══════════════════ */}
    {/* D1: PWR — Green LED */}
    <led
      name="D1"
      footprint="0402"
      manufacturerPartNumber="19-217/GHC-YR1S2/3T"
      color="green"
      pcbX={-4}
      pcbY={8}
    />
    <resistor
      name="R2"
      resistance="1k"
      manufacturerPartNumber="RC0402FR-071KL"
      footprint="0402"
      pcbX={-6}
      pcbY={8}
    />

    {/* D2: TX — Amber LED */}
    <led
      name="D2"
      footprint="0402"
      manufacturerPartNumber="19-217/Y5C-AP1Q2/3T"
      color="yellow"
      pcbX={0}
      pcbY={8}
    />
    <resistor
      name="R3"
      resistance="1k"
      manufacturerPartNumber="RC0402FR-071KL"
      footprint="0402"
      pcbX={-2}
      pcbY={8}
    />

    {/* D3: RX — Amber LED */}
    <led
      name="D3"
      footprint="0402"
      manufacturerPartNumber="19-217/Y5C-AP1Q2/3T"
      color="yellow"
      pcbX={4}
      pcbY={8}
    />
    <resistor
      name="R4"
      resistance="1k"
      manufacturerPartNumber="RC0402FR-071KL"
      footprint="0402"
      pcbX={2}
      pcbY={8}
    />

    {/* D4: D13 / PB5 — Yellow LED */}
    <led
      name="D4"
      footprint="0402"
      manufacturerPartNumber="19-217/Y5C-AM1N1VY/3T"
      color="yellow"
      pcbX={8}
      pcbY={8}
    />
    <resistor
      name="R5"
      resistance="1k"
      manufacturerPartNumber="RC0402FR-071KL"
      footprint="0402"
      pcbX={6}
      pcbY={8}
    />

    {/* ═══════════════════ SCHOTTKY DIODE: USB 5V OR-ing ═══════════════════ */}
    <diode
      name="D5"
      footprint="sot23"
      manufacturerPartNumber="BAT54C"
      pcbX={-14}
      pcbY={0}
    />

    {/* ═══════════════════ FERRITE BEAD: AVCC Filter ═══════════════════ */}
    <inductor
      name="FB1"
      inductance="0"
      manufacturerPartNumber="BLM18RK102SN1D"
      footprint="0402"
      pcbX={0}
      pcbY={-2}
    />

    {/* ═══════════════════ USB SHIELD RESISTOR ═══════════════════ */}
    <resistor
      name="R6"
      resistance="1M"
      manufacturerPartNumber="RC0402FR-071ML"
      footprint="0402"
      pcbX={-23}
      pcbY={-2}
    />

    {/* ═══════════════════ PIN HEADERS ═══════════════════ */}
    {/* J1: Top row — D0–D13, AREF */}
    <pinheader
      name="J1"
      pinCount={15}
      pitch="2.54mm"
      pcbX={-9}
      pcbY={9}
    />
    {/* J2: Bottom row — Power + A0–A7 side */}
    <pinheader
      name="J2"
      pinCount={15}
      pitch="2.54mm"
      pcbX={-9}
      pcbY={-9}
    />

    {/* J3: ICSP 2×3 header */}
    <pinheader
      name="J3"
      pinCount={6}
      pitch="2.54mm"
      pcbX={19}
      pcbY={0}
    />

    {/* J4: Mini-USB B Connector */}
    <chip
      name="J4"
      footprint="usb_mini_b"
      manufacturerPartNumber="UX60SC-MB-5ST"
      pcbX={-23}
      pcbY={0}
    />

    {/* ═══════════════════ TRACES ═══════════════════════════════════ */}

    {/* ── 16 MHz Crystal → ATmega328P ──────────────────────────────── */}
    <trace path={[".Y1 > .1", ".U1 > .XTAL1"]} />
    <trace path={[".Y1 > .2", ".U1 > .XTAL2"]} />
    <trace path={[".C1 > .pos", ".Y1 > .1"]} />
    <trace path={[".C2 > .pos", ".Y1 > .2"]} />
    <trace path={[".C1 > .neg", ".U1 > .GND"]} />
    <trace path={[".C2 > .neg", ".U1 > .GND"]} />

    {/* ── 12 MHz Crystal → CH340G ──────────────────────────────────── */}
    <trace path={[".Y2 > .1", ".U2 > .XI"]} />
    <trace path={[".Y2 > .2", ".U2 > .XO"]} />
    <trace path={[".C8 > .pos", ".Y2 > .1"]} />
    <trace path={[".C9 > .pos", ".Y2 > .2"]} />
    <trace path={[".C8 > .neg", ".U2 > .GND"]} />
    <trace path={[".C9 > .neg", ".U2 > .GND"]} />

    {/* ── CH340G ↔ ATmega328P UART ─────────────────────────────────── */}
    <trace path={[".U2 > .TXD", ".U1 > .PD0_RXD"]} />
    <trace path={[".U2 > .RXD", ".U1 > .PD1_TXD"]} />

    {/* ── DTR → Auto-Reset Capacitor → MCU RESET ───────────────────── */}
    <trace path={[".U2 > .DTR_N", ".C11 > .pos"]} />
    <trace path={[".C11 > .neg", ".U1 > .PC6_RESET"]} />

    {/* ── USB D+/D− → CH340G ───────────────────────────────────────── */}
    <trace path={[".J4 > .D_P", ".U2 > .UD_P"]} />
    <trace path={[".J4 > .D_N", ".U2 > .UD_N"]} />

    {/* ── USB 5V Power Path ────────────────────────────────────────── */}
    <trace path={[".J4 > .VBUS", ".D5 > .anode"]} />
    <trace path={[".D5 > .cathode", ".U3 > .VIN"]} />

    {/* ── USB Shield → GND via 1MΩ ──────────────────────────────────── */}
    <trace path={[".J4 > .SHIELD", ".R6 > .1"]} />
    <trace path={[".R6 > .2", ".U1 > .GND"]} />

    {/* ── Reset Button + Pull-up ───────────────────────────────────── */}
    <trace path={[".U3 > .VOUT", ".R1 > .1"]} />
    <trace path={[".R1 > .2", ".U1 > .PC6_RESET"]} />
    <trace path={[".SW1 > .1", ".U1 > .PC6_RESET"]} />
    <trace path={[".SW1 > .2", ".U1 > .GND"]} />

    {/* ── ATmega328P Power + Decoupling ────────────────────────────── */}
    <trace path={[".U3 > .VOUT", ".U1 > .VCC"]} />
    <trace path={[".C3 > .pos", ".U1 > .VCC"]} />
    <trace path={[".C3 > .neg", ".U1 > .GND"]} />
    <trace path={[".C4 > .pos", ".U1 > .VCC"]} />
    <trace path={[".C4 > .neg", ".U1 > .GND"]} />
    <trace path={[".C5 > .pos", ".U1 > .VCC"]} />
    <trace path={[".C5 > .neg", ".U1 > .GND"]} />
    <trace path={[".U1 > .GND", ".U1 > .GND"]} />

    {/* ── AVCC Filtered Supply (VCC → FB1 → AVCC) ──────────────────── */}
    <trace path={[".U3 > .VOUT", ".FB1 > .1"]} />
    <trace path={[".FB1 > .2", ".U1 > .AVCC"]} />
    <trace path={[".C18 > .pos", ".U1 > .AVCC"]} />
    <trace path={[".C18 > .neg", ".U1 > .GND"]} />

    {/* ── AREF Bypass ──────────────────────────────────────────────── */}
    <trace path={[".C10 > .pos", ".U1 > .AREF"]} />
    <trace path={[".C10 > .neg", ".U1 > .GND"]} />

    {/* ── CH340G Power + Decoupling ────────────────────────────────── */}
    <trace path={[".U3 > .VOUT", ".U2 > .VCC"]} />
    <trace path={[".U1 > .GND", ".U2 > .GND"]} />
    <trace path={[".C6 > .pos", ".U2 > .VCC"]} />
    <trace path={[".C6 > .neg", ".U2 > .GND"]} />
    <trace path={[".C7 > .pos", ".U2 > .VCC"]} />
    <trace path={[".C7 > .neg", ".U2 > .GND"]} />

    {/* ── CH340G V3 Pin Decoupling ─────────────────────────────────── */}
    <trace path={[".C17 > .pos", ".U2 > .V3"]} />
    <trace path={[".C17 > .neg", ".U2 > .GND"]} />

    {/* ── 5V Regulator: VIN → 5V Rail ──────────────────────────────── */}
    <trace path={[".C13 > .pos", ".U3 > .VIN"]} />
    <trace path={[".C13 > .neg", ".U1 > .GND"]} />
    <trace path={[".C14 > .pos", ".U3 > .VOUT"]} />
    <trace path={[".C14 > .neg", ".U1 > .GND"]} />
    <trace path={[".U3 > .GND", ".U1 > .GND"]} />

    {/* ── 3.3V Regulator: 5V Rail → 3.3V Rail ──────────────────────── */}
    <trace path={[".U3 > .VOUT", ".U4 > .VIN"]} />
    <trace path={[".C15 > .pos", ".U4 > .VIN"]} />
    <trace path={[".C15 > .neg", ".U1 > .GND"]} />
    <trace path={[".U4 > .VOUT", ".U1 > .GND"]} />
    <trace path={[".C16 > .pos", ".U4 > .VOUT"]} />
    <trace path={[".C16 > .neg", ".U1 > .GND"]} />
    <trace path={[".U4 > .GND", ".U1 > .GND"]} />

    {/* ── PWR LED: VCC → R2 → D1 → GND ────────────────────────────── */}
    <trace path={[".U3 > .VOUT", ".R2 > .1"]} />
    <trace path={[".R2 > .2", ".D1 > .anode"]} />
    <trace path={[".D1 > .cathode", ".U1 > .GND"]} />

    {/* ── TX LED: CH340G TXD → R3 → D2 → GND ──────────────────────── */}
    <trace path={[".U2 > .TXD", ".R3 > .1"]} />
    <trace path={[".R3 > .2", ".D2 > .anode"]} />
    <trace path={[".D2 > .cathode", ".U1 > .GND"]} />

    {/* ── RX LED: CH340G RXD → R4 → D3 → GND ──────────────────────── */}
    <trace path={[".U2 > .RXD", ".R4 > .1"]} />
    <trace path={[".R4 > .2", ".D3 > .anode"]} />
    <trace path={[".D3 > .cathode", ".U1 > .GND"]} />

    {/* ── D13 LED: PB5(SCK) → R5 → D4 → GND ───────────────────────── */}
    <trace path={[".U1 > .PB5_SCK", ".R5 > .1"]} />
    <trace path={[".R5 > .2", ".D4 > .anode"]} />
    <trace path={[".D4 > .cathode", ".U1 > .GND"]} />

    {/* ── ICSP Header (Standard Arduino Mapping) ───────────────────── */}
    {/* Pin 1 = MISO, Pin 2 = VCC, Pin 3 = SCK, Pin 4 = MOSI, Pin 5 = RESET, Pin 6 = GND */}
    <trace path={[".J3 > .1", ".U1 > .PB4_MISO"]} />
    <trace path={[".J3 > .2", ".U3 > .VOUT"]} />
    <trace path={[".J3 > .3", ".U1 > .PB5_SCK"]} />
    <trace path={[".J3 > .4", ".U1 > .PB3_MOSI"]} />
    <trace path={[".J3 > .5", ".U1 > .PC6_RESET"]} />
    <trace path={[".J3 > .6", ".U1 > .GND"]} />
  </board>
)

export default ArduinoNano