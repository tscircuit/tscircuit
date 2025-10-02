import React from "react"
import { createKicadImportPlugin, PlatformConfig } from "tscircuit"

const platformConfig: PlatformConfig = {
  filetypeHandlers: []
}

const plugin = createKicadImportPlugin(platformConfig)

import kicadMod from "./footprint/myfootprint.kicad_mod"

export default () => (
  <board>
    <chip
      name="U1"
      footprint={kicadMod}
      schX={0}
      schY={0}
    />
  </board>
)

import { importFile } from "tscircuit"

export const ExampleWithLoader = async () => {
  const footprintData = await importFile("./footprint/myfootprint.kicad_mod", platformConfig)
  return (
    <board>
      <chip
        name="U1"
        footprint={footprintData}
        schX={0}
        schY={0}
      />
    </board>
  )
}
