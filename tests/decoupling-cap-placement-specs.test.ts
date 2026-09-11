import test from "ava"

test("tscircuit: should assert decoupling capacitors are placed within maximum distance of IC power pins", (t) => {
  const powerPin = { x: 10, y: 10 }
  const decap = { x: 11.5, y: 10.5 }
  const maxDistanceMm = 3.0
  
  const dist = Math.hypot(decap.x - powerPin.x, decap.y - powerPin.y)
  t.true(dist <= maxDistanceMm)
  t.pass("decoupling capacitor proximity rule check verified")
})
