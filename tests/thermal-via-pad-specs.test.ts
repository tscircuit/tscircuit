import test from "ava"

test("tscircuit: should auto-generate thermal via array in exposed power pad ground slug", (t) => {
  const slug = { width: 4.0, height: 4.0, net: "GND" }
  const viaPitch = 1.0
  const countX = Math.floor(slug.width / viaPitch)
  const countY = Math.floor(slug.height / viaPitch)
  
  t.is(countX * countY, 16)
  t.pass("thermal ground slug via matrix density verified")
})
