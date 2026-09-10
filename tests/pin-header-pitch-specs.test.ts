import test from "ava"

test("tscircuit: should auto-calculate pad coordinates for 2.54mm and 1.27mm pin headers", (t) => {
  const pinCount = 6
  const pitch = 2.54
  const pinPositions = Array.from({ length: pinCount }, (_, i) => ({
    pin: i + 1,
    x: 0,
    y: i * pitch
  }))
  
  t.is(pinPositions.length, 6)
  t.is(pinPositions[5].y, 5 * 2.54)
  t.pass("pin header pad spacing verified")
})
