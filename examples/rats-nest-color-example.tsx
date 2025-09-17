import React from "react"

export const RatsNestColorExample = () => (
  <board width="100mm" height="80mm">
    <group name="power_supply" pcbX="10mm" pcbY="10mm">
      <resistor 
        name="R1" 
        resistance="10kohm" 
        footprint="0805"
        pcbX="0mm" 
        pcbY="0mm" 
        {...({ ratsNestColor: "#ff0000" } as any)}
      />
      <resistor 
        name="R2" 
        resistance="5kohm" 
        footprint="0805"
        pcbX="10mm" 
        pcbY="0mm" 
        {...({ ratsNestColor: "#00ff00" } as any)}
      />
      <capacitor 
        name="C1" 
        capacitance="100nF" 
        footprint="0805"
        pcbX="5mm" 
        pcbY="10mm" 
        {...({ ratsNestColor: "#0000ff" } as any)}
      />
    </group>

    <group name="microcontroller" pcbX="50mm" pcbY="10mm">
      <chip 
        name="U1" 
        footprint="qfp-32"
        pcbX="0mm" 
        pcbY="0mm" 
        {...({ ratsNestColor: "#ffff00" } as any)}
      />
    </group>

    <trace 
      path={[".R1 > .left", ".R2 > .left"]} 
      {...({ ratsNestColor: "#ff0000" } as any)}
      width="0.2mm"
    />
    
    <trace 
      path={[".R1 > .right", ".R2 > .right"]} 
      {...({ ratsNestColor: "#00ff00" } as any)}
      width="0.2mm"
    />

    <trace 
      path={[".U1 > .D0", ".R1 > .right"]} 
      {...({ ratsNestColor: "#00ff00" } as any)}
      width="0.1mm"
    />
    
    <trace 
      path={[".U1 > .D1", ".R2 > .right"]} 
      {...({ ratsNestColor: "#ffff00" } as any)}
      width="0.1mm"
    />

    <trace 
      path={[".U1 > .CLK", ".C1 > .left"]} 
      {...({ ratsNestColor: "#ff00ff" } as any)}
      width="0.15mm"
    />
  </board>
)

export default RatsNestColorExample
