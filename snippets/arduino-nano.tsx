import { board, chip, capacitor, resistor, crystal, led, pushbutton, pinheader, trace } from 'tscircuit'

export const ArduinoNano = () => (
  <board width="50mm" height="18mm" center_x={0} center_y={0}>
    {/* ATmega328P - C14877 */}
    <chip
      name="ATmega328P"
      library="C14877"
      x={0} y={0}
      width={7.62} height={7.62}
      rotation={0}
    >
      {/* Pins 1-28 */}
      <pin name="PC6(RST)" x={-3.81} y={3.81} />
      <pin name="PD0(RXD)" x={-3.81} y={2.54} />
      <pin name="PD1(TXD)" x={-3.81} y={1.27} />
      <pin name="PD2(INT0)" x={-3.81} y={0} />
      <pin name="PD3(INT1)" x={-3.81} y={-1.27} />
      <pin name="PD4(XCK/T0)" x={-3.81} y={-2.54} />
      <pin name="VCC" x={-3.81} y={-3.81} />
      <pin name="GND" x={-2.54} y={-3.81} />
      <pin name="PB6(XTAL1)" x={-1.27} y={-3.81} />
      <pin name="PB7(XTAL2)" x={0} y={-3.81} />
      <pin name="PD5(T1)" x={1.27} y={-3.81} />
      <pin name="PD6(AIN0)" x={2.54} y={-3.81} />
      <pin name="PD7(AIN1)" x={3.81} y={-3.81} />
      <pin name="PB0(ICP)" x={3.81} y={-2.54} />
      <pin name="PB1(OC1A)" x={3.81} y={-1.27} />
      <pin name="PB2(SS/OC1B)" x={3.81} y={0} />
      <pin name="PB3(MOSI/OC2)" x={3.81} y={1.27} />
      <pin name="PB4(MISO)" x={3.81} y={2.54} />
      <pin name="PB5(SCK)" x={3.81} y={3.81} />
      <pin name="AVCC" x={2.54} y={3.81} />
      <pin name="AREF" x={1.27} y={3.81} />
      <pin name="GND" x={0} y={3.81} />
      <pin name="PC0(ADC0)" x={-1.27} y={3.81} />
      <pin name="PC1(ADC1)" x={-2.54} y={3.81} />
      <pin name="PC2(ADC2)" x={-3.81} y={3.81} />
      <pin name="PC3(ADC3)" x={-3.81} y={-2.54} />
      <pin name="PC4(ADC4/SDA)" x={-3.81} y={-1.27} />
      <pin name="PC5(ADC5/SCL)" x={-3.81} y={0} />
    </chip>

    {/* CH340G USB-UART - C14267 */}
    <chip
      name="CH340G"
      library="C14267"
      x={15} y={0}
      width={7.62} height={7.62}
      rotation={0}
    >
      {/* CH340G pins */}
      <pin name="GND" x={-3.81} y={3.81} />
      <pin name="TXD" x={-3.81} y={2.54} />
      <pin name="RXD" x={-3.81} y={1.27} />
      <pin name="V3" x={-3.81} y={0} />
      <pin name="UD+" x={-3.81} y={-1.27} />
      <pin name="UD-" x={-3.81} y={-2.54} />
      <pin name="XI" x={-3.81} y={-3.81} />
      <pin name="XO" x={-2.54} y={-3.81} />
      <pin name="CTS" x={-1.27} y={-3.81} />
      <pin name="RTS" x={0} y={-3.81} />
      <pin name="DTR" x={1.27} y={-3.81} />
      <pin name="DSR" x={2.54} y={-3.81} />
      <pin name="RI" x={3.81} y={-3.81} />
      <pin name="DCD" x={3.81} y={-2.54} />
      <pin name="DSR" x={3.81} y={-1.27} />
      <pin name="RI" x={3.81} y={0} />
      <pin name="DCD" x={3.81} y={1.27} />
      <pin name="DSR" x={3.81} y={2.54} />
      <pin name="RI" x={3.81} y={3.81} />
    </chip>

    {/* USB Mini-B Connector - C46398 */}
    <chip
      name="USB Mini-B"
      library="C46398"
      x={22} y={0}
      width={7.62} height={7.62}
      rotation={0}
    >
      {/* USB pins */}
      <pin name="VBUS" x={-3.81} y={3.81} />
      <pin name="D-" x={-3.81} y={2.54} />
      <pin name="D+" x={-3.81} y={1.27} />
      <pin name="ID" x={-3.81} y={0} />
      <pin name="GND" x={-3.81} y={-1.27} />
      <pin name="SHIELD" x={-3.81} y={-2.54} />
    </chip>

    {/* 16MHz Crystal - C16218 */}
    <crystal
      name="16MHz Crystal"
      library="C16218"
      x={0} y={-10}
      width={3.81} height={3.81}
      rotation={0}
    >
      <pin name="XI" x={-1.905} y={1.905} />
      <pin name="XO" x={1.905} y={1.905} />
    </crystal>

    {/* 22pF Capacitors for Crystal - C1572 */}
    <capacitor
      name="C1 (22pF)"
      library="C1572"
      x={-5} y={-10}
      width={1.905} height={1.905}
      rotation={0}
    />
    <capacitor
      name="C2 (22pF)"
      library="C1572"
      x={5} y={-10}
      width={1.905} height={1.905}
      rotation={0}
    />

    {/* AMS1117-5.0 5V Regulator - C6187 */}
    <chip
      name="5V Regulator"
      library="C6187"
      x={-15} y={0}
      width={7.62} height={7.62}
      rotation={0}
    >
      <pin name="IN" x={-3.81} y={3.81} />
      <pin name="OUT" x={-3.81} y={2.54} />
      <pin name="GND" x={-3.81} y={1.27} />
    </chip>

    {/* AMS1117-3.3 3.3V Regulator - C6186 */}
    <chip
      name="3.3V Regulator"
      library="C6186"
      x={-20} y={0}
      width={7.62} height={7.62}
      rotation={0}
    >
      <pin name="IN" x={-3.81} y={3.81} />
      <pin name="OUT" x={-3.81} y={2.54} />
      <pin name="GND" x={-3.81} y={1.27} />
    </chip>

    {/* Decoupling Capacitors */}
    <capacitor
      name="100nF (AVCC)"
      library="C1525"
      x={-2.54} y={5}
      width={1.905} height={1.905}
      rotation={0}
    />
    <capacitor
      name="100nF (AREF)"
      library="C1525"
      x={0} y={5}
      width={1.905} height={1.905}
      rotation={0}
    />
    <capacitor
      name="100nF (VCC)"
      library="C1525"
      x={2.54} y={5}
      width={1.905} height={1.905}
      rotation={0}
    />

    {/* 10uF Capacitors */}
    <capacitor
      name="10uF (Input)"
      library="C17024"
      x={-12} y={-5}
      width={3.175} height={3.175}
      rotation={0}
    />
    <capacitor
      name="10uF (Output)"
      library="C17024"
      x={-12} y={5}
      width={3.175} height={3.175}
      rotation={0}
    />

    {/* LED - C72043 */}
    <led
      name="LED D13"
      library="C72043"
      x={10} y={0}
      width={1.905} height={1.905}
      rotation={0}
    >
      <pin name="A" x={-0.9525} y={0.9525} />
      <pin name="C" x={0.9525} y={0.9525} />
    </led>

    {/* 10k Resistor for Reset */}
    <resistor
      name="10k Reset Pullup"
      library="C25804"
      x={-5} y={5}
      width={3.175} height={1.5875}
      rotation={0}
    />

    {/* Push Button Reset - C25804 */}
    <pushbutton
      name="Reset Button"
      library="C25804"
      x={-8} y={5}
      width={3.81} height={3.81}
      rotation={0}
    >
      <pin name="1" x={-1.905} y={1.905} />
      <pin name="2" x={1.905} y={1.905} />
    </pushbutton>

    {/* Pin Headers - 2x15 */}
    <pinheader
      name="Header J1 (Digital)"
      library="C25804"
      x={-7.5} y={-7.5}
      width={38.1} height={7.62}
      rotation={90}
    >
      {/* 15 pins */}
      {[...Array(15)].map((_, i) => (
        <pin name={`D${i}`} x={0} y={(i-7)*2.54} />
      ))}
    </pinheader>

    <pinheader
      name="Header J2 (Analog/Power)"
      library="C25804"
      x={7.5} y={-7.5}
      width={38.1} height={7.62}
      rotation={90}
    >
      {/* 15 pins */}
      {[...Array(15)].map((_, i) => (
        <pin name={`A${i}`} x={0} y={(i-7)*2.54} />
      ))}
    </pinheader>

    {/* Traces - connect everything */}
    <trace
      from={{ x: -3.81, y: 3.81 }}
      to={{ x: -2.54, y: 3.81 }}
      width={0.254}
    />
    <trace
      from={{ x: -2.54, y: 3.81 }}
      to={{ x: -1.27, y: 3.81 }}
      width={0.254}
    />
    <trace
      from={{ x: -1.27, y: 3.81 }}
      to={{ x: 0, y: 3.81 }}
      width={0.254}
    />
    <trace
      from={{ x: 0, y: 3.81 }}
      to={{ x: 1.27, y: 3.81 }}
      width={0.254}
    />
    <trace
      from={{ x: 1.27, y: 3.81 }}
      to={{ x: 2.54, y: 3.81 }}
      width={0.254}
    />
    <trace
      from={{ x: 2.54, y: 3.81 }}
      to={{ x: 3.81, y: 3.81 }}
      width={0.254}
    />

    {/* Crystal connections */}
    <trace
      from={{ x: -1.27, y: -3.81 }}
      to={{ x: -5, y: -10 }}
      width={0.254}
    />
    <trace
      from={{ x: 0, y: -3.81 }}
      to={{ x: 5, y: -10 }}
      width={0.254}
    />

    {/* Power traces */}
    <trace
      from={{ x: -3.81, y: -3.81 }}
      to={{ x: -12, y: -5 }}
      width={0.254}
    />
    <trace
      from={{ x: -12, y: -5 }}
      to={{ x: -15, y: 0 }}
      width={0.254}
    />
    <trace
      from={{ x: -15, y: 0 }}
      to={{ x: -12, y: 5 }}
      width={0.254}
    />
    <trace
      from={{ x: -12, y: 5 }}
      to={{ x: -20, y: 0 }}
      width={0.254}
    />

    {/* USB-UART connections */}
    <trace
      from={{ x: -3.81, y: 2.54 }}
      to={{ x: -3.81, y: 1.27 }}
      width={0.254}
    />
    <trace
      from={{ x: -3.81, y: 1.27 }}
      to={{ x: -3.81, y: 0 }}
      width={0.254}
    />

    {/* LED connection */}
    <trace
      from={{ x: 3.81, y: 3.81 }}
      to={{ x: 10, y: 0 }}
      width={0.254}
    />
  </board>
)
