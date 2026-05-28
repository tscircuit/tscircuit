import type { CommonLayoutProps } from "@tscircuit/props"

interface Props extends CommonLayoutProps {}

/**
 * Arduino Nano - ATmega328P based development board
 *
 * Pinout:
 *   Left side  (top to bottom): D1/TX, D0/RX, RST, GND, D2, D3~, D4, D5~, D6~, D7, D8, D9~, D10~, D11~/MOSI, D12/MISO, D13/SCK
 *   Right side (top to bottom): +5V, RST, 3V3, D5~/PWM, A7, A6, A5, A4, A3, A2, A1, A0, REF, 3V3, D13/L_LED, VIN
 *
 * Board dimensions: 18mm x 45mm
 */
export const ArduinoNano = (props: Props) => {
  return (
    <board width="18mm" height="45mm" {...props}>
      {/* Power & Ground */}
      <chip
        name="U1"
        footprint="dip28_600mil"
        manufacturerPartNumber="ATMEGA328P-PU"
        pinLabels={{
          pin1:  "PC6/RESET",
          pin2:  "PD0/RX",
          pin3:  "PD1/TX",
          pin4:  "PD2",
          pin5:  "PD3/PWM",
          pin6:  "PD4",
          pin7:  "VCC",
          pin8:  "GND",
          pin9:  "PB6/XTAL1",
          pin10: "PB7/XTAL2",
          pin11: "PD5/PWM",
          pin12: "PD6/PWM",
          pin13: "PD7",
          pin14: "PB0/ICP",
          pin15: "PB1/OC1A",
          pin16: "PB2/SS",
          pin17: "PB3/MOSI/OC2",
          pin18: "PB4/MISO",
          pin19: "PB5/SCK",
          pin20: "AVCC",
          pin21: "AREF",
          pin22: "GND",
          pin23: "PC0/ADC0",
          pin24: "PC1/ADC1",
          pin25: "PC2/ADC2",
          pin26: "PC3/ADC3",
          pin27: "PC4/ADC4/SDA",
          pin28: "PC5/ADC5/SCL",
        }}
      />

      {/* Header - Left side (D1..D13, GND, RST) */}
      <pinheader
        name="J1"
        pinCount={15}
        pitch="2.54mm"
        direction="left"
        pinLabels={["D1/TX","D0/RX","RST","GND","D2","D3~","D4","D5~","D6~","D7","D8","D9~","D10~","D11~/MOSI","D12/MISO"]}
      />

      {/* Header - Right side (VIN, 3V3, REF, A0..A7, D13, 5V, RST) */}
      <pinheader
        name="J2"
        pinCount={15}
        pitch="2.54mm"
        direction="right"
        pinLabels={["VIN","GND","RST","5V","A7","A6","A5","A4","A3","A2","A1","A0","REF","3V3","D13/SCK"]}
      />

      {/* USB connector */}
      <component
        name="USB1"
        footprint="usb_mini_b"
        manufacturerPartNumber="USB-MINI-B"
      />

      {/* Crystal 16MHz */}
      <chip
        name="Y1"
        footprint="crystal_hc49"
        manufacturerPartNumber="XTAL-16MHZ"
        pinLabels={{ pin1: "XTAL1", pin2: "XTAL2" }}
      />

      {/* Decoupling capacitors */}
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <capacitor name="C2" capacitance="100nF" footprint="0402" />
      <capacitor name="C3" capacitance="22pF"  footprint="0402" />
      <capacitor name="C4" capacitance="22pF"  footprint="0402" />

      {/* Power LED */}
      <led name="LED1" color="green" footprint="0402" />

      {/* Built-in LED on D13 */}
      <led name="LED2" color="yellow" footprint="0402" />

      {/* Reset button */}
      <pushbutton name="SW1" footprint="sw_push_4pin" />

      {/* Voltage regulator 3.3V */}
      <chip
        name="U2"
        footprint="sot23"
        manufacturerPartNumber="LP2985-33DBVR"
        pinLabels={{ pin1: "IN", pin2: "GND", pin3: "OUT", pin4: "EN" }}
      />

      {/* Traces */}
      <trace from=".U1 pin7"  to=".U1 pin20" />  {/* VCC - AVCC */}
      <trace from=".J1 .D1"   to=".U1 .PD1/TX" />
      <trace from=".J1 .D0"   to=".U1 .PD0/RX" />
      <trace from=".J1 .D2"   to=".U1 .PD2" />
      <trace from=".J1 .D3"   to=".U1 .PD3/PWM" />
      <trace from=".J1 .D4"   to=".U1 .PD4" />
      <trace from=".J1 .D5"   to=".U1 .PD5/PWM" />
      <trace from=".J1 .D6"   to=".U1 .PD6/PWM" />
      <trace from=".J1 .D7"   to=".U1 .PD7" />
      <trace from=".J1 .D8"   to=".U1 .PB0/ICP" />
      <trace from=".J1 .D9"   to=".U1 .PB1/OC1A" />
      <trace from=".J1 .D10"  to=".U1 .PB2/SS" />
      <trace from=".J1 .D11"  to=".U1 .PB3/MOSI/OC2" />
      <trace from=".J1 .D12"  to=".U1 .PB4/MISO" />
      <trace from=".J2 .D13"  to=".U1 .PB5/SCK" />
      <trace from=".J2 .A0"   to=".U1 .PC0/ADC0" />
      <trace from=".J2 .A1"   to=".U1 .PC1/ADC1" />
      <trace from=".J2 .A2"   to=".U1 .PC2/ADC2" />
      <trace from=".J2 .A3"   to=".U1 .PC3/ADC3" />
      <trace from=".J2 .A4"   to=".U1 .PC4/ADC4/SDA" />
      <trace from=".J2 .A5"   to=".U1 .PC5/ADC5/SCL" />
    </board>
  )
}

export default ArduinoNano
