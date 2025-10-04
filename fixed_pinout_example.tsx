import React from "react"
import { Circuit } from "./dist"
import { convertCircuitJsonToPinoutSvg } from "circuit-to-svg"

const createFixedPinout = () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="50mm" height="50mm">
      <schematictable x={0} y={-3}>
        <schematicrow>
          <schematiccell text="Raspberry Pi Pico Pinout" />
        </schematicrow>
      </schematictable>
      
      <pinout 
        name="U1" 
        pinLabels={{
          "1": "GP0_SPI0RX_I2C0SDA_UART0TX",
          "2": "GP1_SPI0CSn_I2C0SCL_UART0RX", 
          "3": "GND1",
          "4": "GP2_SPI0SCK_I2C1SDA",
          "5": "GP3_SPI0TX_I2C1SCL",
          "6": ["GP4_SPI0RX", "I2C0SDA", "UART1TX"],
          "7": ["GP5_SPI0CSn", "I2C0SCL", "UART1RX"],
          "8": "GND3",
          "9": "GP6_SPI0SCK_I2C1SDA",
          "10": "GP7_SPI0TX_I2C1SCL",
          "11": "GP8_SPI1RX_I2C0SDA_UART1TX",
          "12": "GP9_SPI1CSn_I2C0SCL_UART1RX",
          "13": "GND4",
          "14": "GP10_SPI1SCK_I2C1SDA",
          "15": "GP11_SPI1TX_I2C1SCL",
          "16": "GP12_SPI1RX_I2C0SDA_UART0TX",
          "17": "GP13_SPI1CSn_I2C0SCL_UART0RX",
          "18": "GND6",
          "19": "GP14_SPI1SCK_I2C1SDA",
          "20": "GP15_SPI1TX_I2C1SCL",
          "21": "GP16_SPI0RX_UART0RX",
          "22": "GP17_SPI0CSn_UART0TX",
          "23": "GND7",
          "24": "GP18_SPI0SCK_I2C1SDA",
          "25": "GP19_SPI0TX_I2C1SCL",
          "26": "GP20_I2C0SDA",
          "27": "GP21_I2C0SCL",
          "28": "GND5",
          "29": "GP22",
          "30": "RUN",
          "31": "GP26_ADC0_I2C1SDA",
          "32": "GP27_ADC1_I2C1SCL",
          "33": "GND_AGND",
          "34": "GP28_ADC2",
          "35": "ADC_VREF",
          "36": "3V3_EN",
          "37": "GND2",
          "38": "VSYS",
          "39": "VBUS",
          "40": "TP1",
          "41": "TP2", 
          "42": "TP3",
          "43": "TP4",
          "44": "TP5",
          "45": "TP6",
          "46": "TP7"
        }}
        pinAttributes={{
          "3": { highlightColor: "red" },
          "8": { highlightColor: "red" },
          "13": { highlightColor: "red" },
          "18": { highlightColor: "red" },
          "23": { highlightColor: "red" },
          "28": { highlightColor: "red" },
          "33": { highlightColor: "red" },
          "37": { highlightColor: "red" }
        }}
        schWidth="0mm"
        schHeight="0mm"
        schPinSpacing={0.3}
        showPinAliases={true}
        schPortArrangement={{
          left: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
          right: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]
        }}
      />
    </board>
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()
  
  const pinoutSvg = convertCircuitJsonToPinoutSvg(circuitJson)
  
  return { circuitJson, pinoutSvg }
}

const result = createFixedPinout()
