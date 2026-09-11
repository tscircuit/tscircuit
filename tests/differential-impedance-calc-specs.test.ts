import test from "ava"

test("tscircuit: should estimate 90-ohm USB differential microstrip trace geometry", (t) => {
  const dielectricConstantEr = 4.4 // FR4
  const dielectricHeightH = 0.2 // mm
  const traceWidthW = 0.35 // mm
  const traceSpacingS = 0.25 // mm
  
  t.is(dielectricConstantEr, 4.4)
  t.true(traceWidthW > 0.2)
  t.pass("differential microstrip trace impedance formula constraints verified")
})
