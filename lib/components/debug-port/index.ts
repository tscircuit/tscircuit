

export interface DebugPortConfig {
  name?: string
  x?: number
  y?: number
  width?: number
  height?: number
  pinCount?: number
}

export function createDebugPortJsx(config: DebugPortConfig = {}): string {
  const {
    name = "DEBUG_PORT",
    x = 0,
    y = 0,
    width = 30,
    height = 20,
    pinCount = 20,
  } = config

  const pinLabels = Array.from({ length: pinCount }, (_, i) => `D${i + 1}`)

  const maxTraces = Math.min(pinCount, 16)
  const debugPinTraces = pinLabels.slice(0, maxTraces).map((pinLabel, index) =>
    `        <trace path={[".${name}_DEBUG_HEADER > .${pinLabel}", ".${name}_RP2040 > .GPIO${index + 6}"]} />`
  ).join('\n')

  const externalPorts = pinLabels.map((pinLabel, index) =>
    `          <port name="${name}_EXT_${pinLabel}" x={${width + 2}} y={${index * 1.27}} pinLabel="${pinLabel}" />`
  ).join('\n')

  return `
  <group name="${name}" x={${x}} y={${y}}>
    <board width="${width}mm" height="${height}mm" name="${name}_BOARD">
      <chip
        name="${name}_RP2040"
        footprint="qfn32"
        pinLabels={[
          "GND", "GPIO0", "GPIO1", "GND",
          "GPIO2", "GPIO3", "GPIO4", "GPIO5",
          "GND", "GPIO6", "GPIO7", "GPIO8",
          "GPIO9", "GND", "GPIO10", "GPIO11",
          "GPIO12", "GND", "GPIO13", "GPIO14",
          "GPIO15", "GPIO16", "GND", "GPIO17",
          "GPIO18", "GPIO19", "GPIO20", "GPIO21",
          "GND", "GPIO22", "GPIO23", "GPIO24"
        ]}
        schX={5}
        schY={8}
      />

      <chip
        name="${name}_ADC"
        footprint="soic8"
        pinLabels={["VDD", "AIN1", "AIN2", "GND", "CLK", "DOUT", "DIN", "CS"]}
        schX={15}
        schY={8}
      />

      <pinHeader
        name="${name}_SPI_HEADER"
        pinCount={6}
        schX={5}
        schY={12}
        pinLabels={["GND", "3.3V", "MOSI", "MISO", "SCK", "CS"]}
      />

      <pinHeader
        name="${name}_DEBUG_HEADER"
        pinCount={${pinCount}}
        schX={15}
        schY={12}
        pinLabels={${JSON.stringify(pinLabels)}}
      />

      <resistor name="${name}_R1" resistance="10k" footprint="0805" schX={20} schY={5} />
      <capacitor name="${name}_C1" capacitance="10uF" footprint="0805" schX={22} schY={5} />

      <ground name="${name}_GND1" schX={2} schY={2} />
      <ground name="${name}_GND2" schX={25} schY={2} />

      <trace path={[".${name}_RP2040 > .GPIO0", ".${name}_ADC > .AIN1"]} />
      <trace path={[".${name}_RP2040 > .GPIO1", ".${name}_ADC > .AIN2"]} />

      <trace path={[".${name}_RP2040 > .GPIO2", ".${name}_SPI_HEADER > .MOSI"]} />
      <trace path={[".${name}_RP2040 > .GPIO3", ".${name}_SPI_HEADER > .MISO"]} />
      <trace path={[".${name}_RP2040 > .GPIO4", ".${name}_SPI_HEADER > .SCK"]} />
      <trace path={[".${name}_RP2040 > .GPIO5", ".${name}_SPI_HEADER > .CS"]} />

${debugPinTraces}

      <trace path={[".${name}_R1 > .pos", ".${name}_SPI_HEADER > .3V3"]} />
      <trace path={[".${name}_R1 > .neg", ".${name}_GND1 > .gnd"]} />
      <trace path={[".${name}_C1 > .pos", ".${name}_R1 > .pos"]} />
      <trace path={[".${name}_C1 > .neg", ".${name}_GND1 > .gnd"]} />
      <trace path={[".${name}_ADC > .VDD", ".${name}_SPI_HEADER > .3V3"]} />
      <trace path={[".${name}_ADC > .GND", ".${name}_GND1 > .gnd"]} />
      <trace path={[".${name}_RP2040 > .GND", ".${name}_GND1 > .gnd"]} />
    </board>

    <group name="${name}_CABLES">
${externalPorts}
    </group>
  </group>`
}
