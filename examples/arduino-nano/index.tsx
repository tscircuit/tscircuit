import { ATmega328Circuit } from "./lib/ATmega328Circuit"
import { CH340Circuit } from "./lib/CH340Circuit"
import { CrystalCircuit } from "./lib/CrystalCircuit"
import { LedCircuit } from "./lib/LedCircuit"
import { PinHeaders } from "./lib/PinHeaders"
import { PowerCircuit } from "./lib/PowerCircuit"
import { UsbConnector } from "./lib/UsbConnector"

/**
 * Arduino Nano V3.0 (ATmega328P + CH340G) — tscircuit recreation.
 * Reference: https://store-usa.arduino.cc/products/arduino-nano
 */
export default () => (
  <board width="45mm" height="18mm" center_x={0} center_y={0}>
    <PowerCircuit />
    <CrystalCircuit />
    <ATmega328Circuit />
    <CH340Circuit />
    <UsbConnector />
    <LedCircuit />
    <PinHeaders />
  </board>
)
