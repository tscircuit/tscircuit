import { board, chip, capacitor, resistor, crystal, led, pushbutton, pinheader, trace } from 'tscircuit'

export const ArduinoNano = () => (
  <board name="Arduino_Nano" width="45mm" height="18mm" center_x={0} center_y={0}>
    {/* ATmega328P-MU (QFN-32) - Arduino Nano core */}
    <chip
      name="ATmega328P"
      library="C14877"
      x={12} y={9}
      width={7} height={7}
      rotation={0}
    />

    {/* CH340G USB-to-Serial converter (common in clones) */}
    <chip
      name="CH340G"
      library="C14267"
      x={-12} y={9}
      width={7} height={7}
      rotation={0}
    />

    {/* 16MHz Crystal with load capacitors */}
    <crystal
      name="X1"
      library="C16218"
      x={12} y={-6}
      width={3} height={1.5}
    />

    {/* Load capacitors for crystal */}
    <capacitor
      name="C1"
      library="C1572"
      value="22pF"
      x={9} y={-6}
      width={1} height={1}
    />
    <capacitor
      name="C2"
      library="C1572"
      value="22pF"
      x={15} y={-6}
      width={1} height={1}
    />

    {/* AMS1117-5.0: 7-12V -> 5V regulator */}
    <chip
      name="U1_5V"
      library="C6187"
      x={-12} y={3}
      width={4} height={3}
    />

    {/* Input capacitor for 5V regulator */}
    <capacitor
      name="C3"
      library="C17024"
      value="10uF"
      x={-14} y={3}
      width={2} height={2}
    />

    {/* Output capacitor for 5V regulator */}
    <capacitor
      name="C4"
      library="C17024"
      value="10uF"
      x={-9} y={3}
      width={2} height={2}
    />

    {/* AMS1117-3.3: 5V -> 3.3V regulator */}
    <chip
      name="U1_3V3"
      library="C6186"
      x={-12} y={-3}
      width={4} height={3}
    />

    {/* Decoupling capacitors */}
    <capacitor
      name="C5"
      library="C1525"
      value="100nF"
      x={10} y={10}
      width={0.8} height={0.8}
    />
    <capacitor
      name="C6"
      library="C1525"
      value="100nF"
      x={14} y={10}
      width={0.8} height={0.8}
    />
    <capacitor
      name="C7"
      library="C1525"
      value="100nF"
      x={10} y={14}
      width={0.8} height={0.8}
    />

    {/* Reset pushbutton */}
    <pushbutton
      name="S1"
      library="C25804"
      x={-12} y={-8}
      width={4} height={4}
    />

    {/* 10kOhm pull-up resistor for reset */}
    <resistor
      name="R1"
      library="C25804"
      value="10k"
      x={-9} y={-8}
      width={3} height={1}
    />

    {/* D13 status LED with current-limiting resistor */}
    <led
      name="D13"
      library="C72043"
      x={20} y={9}
      width={1} height={1}
    />
    <resistor
      name="R2"
      library="C25804"
      value="330"
      x={22} y={9}
      width={2} height={1}
    />

    {/* USB Mini-B connector */}
    <chip
      name="USB1"
      library="C46398"
      x={-12} y={-12}
      width={5} height={4}
    />

    {/* 2x15 Pin headers (0.1" pitch) */}
    <pinheader
      name="J1"
      library="C25804"
      x={25} y={9}
      width={38.1} height={3.81}
    />
    <pinheader
      name="J2"
      library="C25804"
      x={-25} y={9}
      width={38.1} height={3.81}
    />

    {/* Traces - Power connections */}
    <trace
      from={{ x: -12, y: 4.5 }}
      to={{ x: -12, y: 0 }}
      width={0.5}
    />
    <trace
      from={{ x: -12, y: -2.5 }}
      to={{ x: -12, y: -6 }}
      width={0.5}
    />

    {/* Traces - UART connection */}
    <trace
      from={{ x: -6, y: 9 }}
      to={{ x: 0, y: 9 }}
      width={0.25}
    />

    {/* Traces - Crystal to ATmega */}
    <trace
      from={{ x: 10.5, y: -6 }}
      to={{ x: 9, y: -4 }}
      width={0.2}
    />
    <trace
      from={{ x: 13.5, y: -6 }}
      to={{ x: 15, y: -4 }}
      width={0.2}
    />

    {/* Traces - LED to GND */}
    <trace
      from={{ x: 21, y: 9 }}
      to={{ x: 22, y: 9 }}
      width={0.25}
    />

  </board>
)
