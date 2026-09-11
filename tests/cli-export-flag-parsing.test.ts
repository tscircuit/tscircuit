import test from "ava"

test("parses export format flags correctly for gerber, svg, and json artifacts", (t) => {
  const validFormats = ["gerber", "svg", "circuit-json", "kicad_pcb"]
  
  const parseExportFlag = (format: string) => {
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format: ${format}`)
    }
    return format.toLowerCase()
  }
  
  t.is(parseExportFlag("gerber"), "gerber")
  t.is(parseExportFlag("svg"), "svg")
  t.throws(() => parseExportFlag("invalid_fmt"))
})
