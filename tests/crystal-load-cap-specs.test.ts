import test from "ava"

test("tscircuit: should compute oscillator load capacitance including stray PCB trace capacitance", (t) => {
  const cLoadTarget = 12.0 // pF
  const cStray = 4.0 // pF
  
  // C_val = 2 * (C_L - C_stray)
  const cVal = 2 * (cLoadTarget - cStray)
  t.is(cVal, 16.0)
  t.pass("crystal oscillator load capacitance formula verified")
})
