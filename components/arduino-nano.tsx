import { createComponent } from "@tscircuit/core"

export const ArduinoNano = createComponent({
  name: "arduino-nano",
  symbolName: "arduino-nano",
  footprint: "arduino-nano-v3",
  ports: {
    D0: "digital",
    D1: "digital",
    D2: "digital",
    D3: "digital",
    D4: "digital",
    D5: "digital",
    D6: "digital",
    D7: "digital",
    D8: "digital",
    D9: "digital",
    D10: "digital",
    D11: "digital",
    D12: "digital",
    D13: "digital",
    "5V": "power",
    GND: "power",
    "3V3": "power",
    RST: "power",
  },
})
