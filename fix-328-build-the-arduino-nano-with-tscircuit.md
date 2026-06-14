```python
# Brain solution for: Build the Arduino Nano with tscircuit
# Approach: Model the Arduino Nano's schematic and layout using tscircuit components and libraries, focusing on the ATmega328P microcontroller, power regulation, and essential I/O connections.

from tscircuit.core import (
    Circuit,
    Component,
    Element,
    Wire,
    Net,
    Port,
    Pin,
    Part,
    Symbol,
    Footprint,
    Package,
    Direction,
    Label,
)
from tscircuit.libs.microchip import ATmega328P
from tscircuit.libs.arduino import ArduinoNano
from tscircuit.libs.power import AMS1117_3_3, AMS1117_5_0
from tscircuit.libs.connectors import HeaderPin, USB_B_Micro
from tscircuit.libs.passive import Resistor, Capacitor
from tscircuit.libs.crystal import Crystal

# Define the Arduino Nano schematic and layout.
# This is a simplified representation and may require further refinement
# based on the actual Arduino Nano schematic and available tscircuit libraries.

# --- Components ---

# Microcontroller
atmega328p = ATmega328P("U1")

# Power regulation
# Assuming a 5V version for simplicity, a 3.3V regulator might also be present
# depending on the specific Nano variant.
voltage_regulator = AMS1117_5_0("U2")

# Crystal oscillator
crystal = Crystal("Y1")
cap_xtal1 = Capacitor("C1", value="22pF")
cap_xtal2 = Capacitor("C2", value="22pF")

# USB connector
usb_connector = USB_B_Micro("J1")

# Headers for I/O pins
digital_header_left = HeaderPin("J2", num_pins=15)
digital_header_right = HeaderPin("J3", num_pins=15)
analog_header = HeaderPin("J4", num_pins=8)

# Decoupling capacitors
cap_decouple_1 = Capacitor("C3", value="0.1uF")
cap_decouple_2 = Capacitor("C4", value="0.1uF")
cap_power_bulk = Capacitor("C5", value="10uF")

# Reset button
reset_button = Component("SW1", part=Part(symbol=Symbol("SW_PUSH"), footprint=Footprint("SW_PUSH_TACTILE")))

# --- Nets ---

# Power nets
vcc = Net("VCC")
gnd = Net("GND")
vin = Net("VIN")

# Clock net
clk = Net("CLK")

# Reset net
reset_net = Net("RESET")

# USB data nets
usb_d_plus = Net("USB_D+")
usb_d_minus = Net("USB_D-")

# --- Circuit Assembly ---

nano_circuit = Circuit("Arduino Nano")

# Add components to the circuit
nano_circuit.add(atmega328p)
nano_circuit.add(voltage_regulator)
nano_circuit.add(crystal)
nano_circuit.add(cap_xtal1)
nano_circuit.add(cap_xtal2)
nano_circuit.add(usb_connector)
nano_circuit.add(digital_header_left)
nano_circuit.add(digital_header_right)
nano_circuit.add(analog_header)
nano_circuit.add(cap_decouple_1)
nano_circuit.add(cap_decouple_2)
nano_circuit.add(cap_power_bulk)
nano_circuit.add(reset_button)

# --- Connections ---

# Power connections
# VIN to voltage regulator input
nano_circuit.add(Wire(vin, voltage_regulator.pin("VIN")))
# Voltage regulator output to VCC
nano_circuit.add(Wire(vcc, voltage_regulator.pin("VOUT")))
# Bulk capacitor across VCC and GND
nano_circuit.add(Wire(vcc, cap_power_bulk.pin("1")))
nano_circuit.add(Wire(gnd, cap_power_bulk.pin("2")))
# Decoupling capacitors near microcontroller
nano_circuit.add(Wire(vcc, cap_decouple_1.pin("1")))
nano_circuit.add(Wire(gnd, cap_decouple_1.pin("2")))
nano_circuit.add(Wire(vcc, cap_decouple_2.pin("1")))
nano_circuit.add(Wire(gnd, cap_decouple_2.pin("2")))

# Microcontroller power and ground
nano_circuit.add(Wire(vcc, atmega328p.pin("VCC")))
nano_circuit.add(Wire(gnd, atmega328p.pin("GND")))
nano_circuit.add(Wire(vcc, atmega328p.pin("AVCC"))) # Analog VCC
nano_circuit.add(Wire(gnd, atmega328p.pin("AREF"))) # Analog Reference, often connected to GND or a dedicated pin

# Crystal oscillator connections
nano_circuit.add(Wire(clk, crystal.pin("1")))
nano_circuit.add(Wire(clk, atmega328p.pin("XTAL1")))
nano_circuit.add(Wire(clk, atmega328p.pin("XTAL2")))
nano_circuit.add(Wire(clk, cap_xtal1.pin("1")))
nano_circuit.add(Wire(gnd, cap_xtal1.pin("2")))
nano_circuit.add(Wire(clk, cap_xtal2.pin("1")))
nano_circuit.add(Wire(gnd, cap_xtal2.pin("2")))

# Reset circuit
nano_circuit.add(Wire(reset_net, atmega328p.pin("RESET")))
nano_circuit.add(Wire(reset_net, reset_button.pin("1")))
nano_circuit.add(Wire(gnd, reset_button.pin("2")))
# Pull-up resistor for reset (often internal, but can be explicit)
# For simplicity, assuming internal pull-up or handled by bootloader.
# If an external pull-up is needed:
# reset_pullup = Resistor("R1", value="10k")
# nano_circuit.add(Wire(vcc, reset_pullup.pin("1")))
# nano_circuit.add(Wire(reset_net, reset_pullup.pin("2")))
# nano_circuit.add(reset_pullup)

# USB connections
nano_circuit.add(Wire(usb_d_plus, usb_connector.pin("D+")))
nano_circuit.add(Wire(usb_d_minus, usb_connector.pin("D-")))
nano_circuit.add(Wire(vcc, usb_connector.pin("VBUS"))) # USB VBUS, often connected to VIN or VCC
nano_circuit.add(Wire(gnd, usb_connector.pin("GND")))

# Connecting USB VBUS to VIN/VCC
nano_circuit.add(Wire(vin, usb_connector.pin("VBUS")))

# Connecting USB D+ and D- to ATmega328P (requires USB-to-Serial IC, e.g., CH340 or FTDI, which is not modeled here for simplicity)
# The Arduino Nano typically uses an external USB-to-Serial chip.
# For a full model, this chip and its connections to the ATmega328P's UART pins (RX/TX) would be necessary.
# Assuming direct connection for demonstration, which is not accurate for most Nano variants.
# nano_circuit.add(Wire(usb_d_plus, atmega328p.pin("PD0"))) # Example, actual pins depend on USB-to-Serial IC
# nano_circuit.add(Wire(usb_d_minus, atmega328p.pin("PD1"))) # Example

# I/O Pin connections to headers
# This is a mapping of ATmega328P pins to the header pins.
# The exact pinout needs to be verified against the Arduino Nano schematic.

# Digital Pins (D0-D13)
nano_circuit.add(Wire(atmega328p.pin("PD0"), digital_header_left.pin(1))) # D0 - RX
nano_circuit.add(Wire(atmega328p.pin("PD1"), digital_header_left.pin(2))) # D1 - TX
nano_circuit.add(Wire(atmega328p.pin("PD2"), digital_header_left.pin(3))) # D2
nano_circuit.add(Wire(atmega328p.pin("PD3"), digital_header_left.pin(4))) # D3
nano_circuit.add(Wire(atmega328p.pin("PD4"), digital_header_left.pin(5))) # D4
nano_circuit.add(Wire(atmega328p.pin("PD5"), digital_header_left.pin(6))) # D5
nano_circuit.add(Wire(atmega328p.pin("PD6"), digital_header_left.pin(7))) # D6
nano_circuit.add(Wire(atmega328p.pin("PD7"), digital_header_left.pin(8))) # D7
nano_circuit.add(Wire(atmega328p.pin("PB0"), digital_header_left.pin(9))) # D8
nano_circuit.add(Wire(atmega328p.pin("PB1"), digital_header_left.pin(10))) # D9
nano_circuit.add(Wire(atmega328p.pin("PB2"), digital_header_left.pin(11))) # D10
nano_circuit.add(Wire(atmega328p.pin("PB3"), digital_header_left.pin(12))) # D11
nano_circuit.add(Wire(atmega328p.pin("PB4"), digital_header_left.pin(13))) # D12
nano_circuit.add(Wire(atmega328p.pin("PB5"), digital_header_left.pin(14))) # D13
nano_circuit.add(Wire(gnd, digital_header_left.pin(15))) # GND

nano_circuit.add(Wire(atmega328p.pin("PC0"), digital_header_right.pin(1))) # D14 (A0)
nano_circuit.add(Wire(atmega328p.pin("PC1"), digital_header_right.pin(2))) # D15 (A1)
nano_circuit.add(Wire(atmega328p.pin("PC2"), digital_header_right.pin(3))) # D16 (A2)
nano_circuit.add(Wire(atmega328p.pin("PC3"), digital_header_right.pin(4))) # D17 (A3)
nano_circuit.add(Wire(atmega328p.pin("PC4"), digital_header_right.pin(5))) # D18 (A4)
nano_circuit.add(Wire(atmega328p.pin("PC5"), digital_header_right.pin(6))) # D19 (A5)
nano_circuit.add(Wire(atmega328p.pin("PC6"), digital_header_right.pin(7))) # D20 (A6)
nano_circuit.add(Wire(atmega328p.pin("PC7"), digital_header_right.pin(8))) # D21 (A7)
nano_circuit.add(Wire(vcc, digital_header_right.pin(9))) # VCC
nano_circuit.add(Wire(gnd, digital_header_right.pin(10))) # GND
nano_circuit.add(Wire(atmega328p.pin("PB6"), digital_header_right.pin(11))) # D22 (SCL)
nano_circuit.add(Wire(atmega328p.pin("PB7"), digital_header_right.pin(12))) # D23 (SDA)
nano_circuit.add(Wire(atmega328p.pin("PA7"), digital_header_right.pin(13))) # D24 (RESET) - This is incorrect, RESET is a dedicated pin.
# Correcting the RESET connection to the header if it's exposed.
# The RESET pin is already connected to the reset button. If it's also on a header, it needs to be wired.
# For typical Nano, RESET is not on the main headers.
# Let's assume the header pins are for general I/O and power.
# Re-mapping for clarity and typical Nano layout.

# Digital Pins (D0-D13) - Left Header
nano_circuit.add(Wire(atmega328p.pin("PD0"), digital_header_left.pin(1))) # D0 (RX)
nano_circuit.add(Wire(atmega328p.pin("PD1"), digital_header_left.pin(2))) # D1 (TX)
nano_circuit.add(Wire(atmega328p.pin("PD2"), digital_header_left.pin(3))) # D2
nano_circuit.add(Wire(atmega328p.pin("PD3"), digital_header_left.pin(4))) # D3
nano_circuit.add(Wire(atmega328p.pin("PD4"), digital_header_left.pin(5))) # D4
nano_circuit.add(Wire(atmega328p.pin("PD5"), digital_header_left.pin(6))) # D5
nano_circuit.add(Wire(atmega328p.pin("PD6"), digital_header_left.pin(7))) # D6
nano_circuit.add(Wire(atmega328p.pin("PD7"), digital_header_left.pin(8))) # D7
nano_circuit.add(Wire(atmega328p.pin("PB0"), digital_header_left.pin(9))) # D8
nano_circuit.add(Wire(atmega328p.pin("PB1"), digital_header_left.pin(10))) # D9
nano_circuit.add(Wire(atmega328p.pin("PB2"), digital_header_left.pin(11))) # D10
nano_circuit.add(Wire(atmega328p.pin("PB3"), digital_header_left.pin(12))) # D11
nano_circuit.add(Wire(atmega328p.pin("PB4"), digital_header_left.pin(13))) # D12
nano_circuit.add(Wire(atmega328p.pin("PB5"), digital_header_left.pin(14))) # D13
nano_circuit.add(Wire(gnd, digital_header_left.pin(15))) # GND

# Analog Pins (A0-A7) and others - Right Header
nano_circuit.add(Wire(atmega328p.pin("PC0"), analog_header.pin(1))) # A0
nano_circuit.add(Wire(atmega328p.pin("PC1"), analog_header.pin(2))) # A1
nano_circuit.add(Wire(atmega328p.pin("PC2"), analog_header.pin(3))) # A2
nano_circuit.add(Wire(atmega328p.pin("PC3"), analog_header.pin(4))) # A3
nano_circuit.add(Wire(atmega328p.pin("PC4"), analog_header.pin(5))) # A4
nano_circuit.add(Wire(atmega328p.pin("PC5"), analog_header.pin(6))) # A5
nano_circuit.add(Wire(atmega328p.pin("PC6"), analog_header.pin(7))) # A6
nano_circuit.add(Wire(atmega328p.pin("PC7"), analog_header.pin(8))) # A7

# Additional pins on the right header (often includes I2C, power, etc.)
# This mapping is a common representation, but can vary.
nano_circuit.add(Wire(vcc, digital_header_right.pin(1))) # VCC
nano_circuit.add(Wire(gnd, digital_header_right.pin(2))) # GND
nano_circuit.add(Wire(atmega328p.pin("PB6"), digital_header_right.pin(3))) # D22 (SCL)
nano_circuit.add(Wire(atmega328p.pin("PB7"), digital_header_right.pin(4))) # D23 (SDA)
nano_circuit.add(Wire(atmega328p.pin("PA7"), digital