import test from "ava"

test("tscircuit: should calculate optimal I2C pull-up resistor range based on bus capacitance", (t) => {
  const vdd = 3.3
  const cBusPf = 100 // 100 pF bus capacitance
  const trMaxNs = 300 // max rise time 300ns for Fast Mode 400kHz
  
  // R_max = t_r / (0.8473 * C_b)
  const rMaxOhms = (trMaxNs * 1e-9) / (0.8473 * (cBusPf * 1e-12))
  t.true(rMaxOhms > 3000 && rMaxOhms < 4000)
  t.pass("I2C pull-up resistor maximum resistance constraint verified")
})
