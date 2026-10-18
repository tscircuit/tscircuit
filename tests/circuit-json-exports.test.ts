import { expectTypeOf, test } from "bun:test"
import type * as CircuitJson from "circuit-json"
import type * as Tscircuit from "../index"

test("entry point re-exports core Circuit JSON element types", () => {
  expectTypeOf<Tscircuit.AnyCircuitElement>().toEqualTypeOf<CircuitJson.AnyCircuitElement>()
  expectTypeOf<Tscircuit.CircuitJson>().toEqualTypeOf<CircuitJson.CircuitJson>()
  expectTypeOf<Tscircuit.PcbBoard>().toEqualTypeOf<CircuitJson.PcbBoard>()
  expectTypeOf<Tscircuit.PcbComponent>().toEqualTypeOf<CircuitJson.PcbComponent>()
  expectTypeOf<Tscircuit.PcbFabricationNotePath>().toEqualTypeOf<CircuitJson.PcbFabricationNotePath>()
  expectTypeOf<Tscircuit.PcbFabricationNoteText>().toEqualTypeOf<CircuitJson.PcbFabricationNoteText>()
  expectTypeOf<Tscircuit.PcbHole>().toEqualTypeOf<CircuitJson.PcbHole>()
  expectTypeOf<Tscircuit.PcbPlatedHole>().toEqualTypeOf<CircuitJson.PcbPlatedHole>()
  expectTypeOf<Tscircuit.PcbPort>().toEqualTypeOf<CircuitJson.PcbPort>()
  expectTypeOf<Tscircuit.PcbSmtPad>().toEqualTypeOf<CircuitJson.PcbSmtPad>()
  expectTypeOf<Tscircuit.PcbTrace>().toEqualTypeOf<CircuitJson.PcbTrace>()
  expectTypeOf<Tscircuit.PcbVia>().toEqualTypeOf<CircuitJson.PcbVia>()
  expectTypeOf<Tscircuit.SchematicBox>().toEqualTypeOf<CircuitJson.SchematicBox>()
  expectTypeOf<Tscircuit.SchematicComponent>().toEqualTypeOf<CircuitJson.SchematicComponent>()
  expectTypeOf<Tscircuit.SchematicPort>().toEqualTypeOf<CircuitJson.SchematicPort>()
  expectTypeOf<Tscircuit.SchematicText>().toEqualTypeOf<CircuitJson.SchematicText>()
  expectTypeOf<Tscircuit.SchematicTrace>().toEqualTypeOf<CircuitJson.SchematicTrace>()
  expectTypeOf<Tscircuit.SourceComponent>().toEqualTypeOf<CircuitJson.SourceComponent>()
  expectTypeOf<Tscircuit.SourceGroup>().toEqualTypeOf<CircuitJson.SourceGroup>()
  expectTypeOf<Tscircuit.SourceNet>().toEqualTypeOf<CircuitJson.SourceNet>()
  expectTypeOf<Tscircuit.SourcePort>().toEqualTypeOf<CircuitJson.SourcePort>()
  expectTypeOf<Tscircuit.SourceTrace>().toEqualTypeOf<CircuitJson.SourceTrace>()
})
