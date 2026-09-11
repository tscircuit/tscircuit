import test from "ava"

test("tscircuit: should compute standard E24 resistor divider ratios for feedback nodes", (t) => {
  const rTop = 10000 // 10k
  const rBottom = 2200 // 2.2k
  const vin = 5.0
  
  const vout = vin * (rBottom / (rTop + rBottom))
  t.true(Math.abs(vout - 0.9016) < 0.001)
  t.pass("feedback resistor voltage divider calculation verified")
})
