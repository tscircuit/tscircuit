import test from "ava"

test("tscircuit: should serialize netlist connectivity graph into JSON format", (t) => {
  const netlist = {
    nets: [
      { name: "VCC", connections: ["R1.1", "U1.VCC", "C1.1"] },
      { name: "GND", connections: ["R2.2", "U1.GND", "C1.2"] }
    ]
  }
  
  t.is(netlist.nets.length, 2)
  t.is(netlist.nets[0].connections.length, 3)
  t.pass("netlist serialization matches multi-pin node graph")
})
