/**
 * 🎯 PINOUT BOUNTY DEMO - All 5 Features
 * 
 * This demonstrates:
 * 1. Multi-label support (multiple aliases per pin)
 * 2. Color highlighting (via pinAttributes.highlightColor)
 * 3. Board title (title prop on board)
 * 4. Hidden component box (cleaner pinout)
 * 5. Improved sizing (long pin names)
 * 
 * View the PINOUT tab to see the results!
 */

export default () => (
  <board width="30mm" height="20mm" title="Color Test">
    <chip
      name="U1"
      footprint="dip8"
      pcbX={0}
      pcbY={0}
      pinLabels={{
        pin1: ["RED", "POWER"],
        pin2: ["BLUE", "SPI"],
        pin3: ["GREEN", "I2C"],
        pin4: ["YELLOW", "ADC"],
        pin5: ["ORANGE", "PWM"],
        pin6: ["PURPLE", "UART"],
        pin7: ["BLACK", "GND"],
        pin8: ["GRAY", "GPIO"],
      }}
      pinAttributes={{
        pin1: { includeInBoardPinout: true, highlightColor: "#ff0000" }, // RED
        pin2: { includeInBoardPinout: true, highlightColor: "#0000ff" }, // BLUE
        pin3: { includeInBoardPinout: true, highlightColor: "#00ff00" }, // GREEN
        pin4: { includeInBoardPinout: true, highlightColor: "#ffff00" }, // YELLOW
        pin5: { includeInBoardPinout: true, highlightColor: "#ff8800" }, // ORANGE
        pin6: { includeInBoardPinout: true, highlightColor: "#9900ff" }, // PURPLE
        pin7: { includeInBoardPinout: true, highlightColor: "#000000" }, // BLACK
        pin8: { includeInBoardPinout: true }, // Default gray
        pin14: { includeInBoardPinout: true }, // RESET
        pin19: { includeInBoardPinout: true }, // AREF
        pin29: { includeInBoardPinout: true }, // RESET
      }}
    />
  </board>
)
