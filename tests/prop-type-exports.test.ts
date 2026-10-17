import { expectTypeOf, test } from "bun:test"
import type {
  AutorouterProp as PropsAutorouterProp,
  BoardProps as PropsBoardProps,
  CadModelProps as PropsCadModelProps,
  CapacitorProps as PropsCapacitorProps,
  ChipProps as PropsChipProps,
  CommonLayoutProps as PropsCommonLayoutProps,
  DiodeProps as PropsDiodeProps,
  FootprintProps as PropsFootprintProps,
  GroupProps as PropsGroupProps,
  HoleProps as PropsHoleProps,
  ImplicitBreakoutPointSolverFn as PropsImplicitBreakoutPointSolverFn,
  InductorProps as PropsInductorProps,
  LedProps as PropsLedProps,
  NetProps as PropsNetProps,
  PcbLayoutProps as PropsPcbLayoutProps,
  PinLabelsProp as PropsPinLabelsProp,
  PlatedHoleProps as PropsPlatedHoleProps,
  PortHints as PropsPortHints,
  ResistorProps as PropsResistorProps,
  SilkscreenPathProps as PropsSilkscreenPathProps,
  SilkscreenTextProps as PropsSilkscreenTextProps,
  SmtPadProps as PropsSmtPadProps,
  SubcircuitProps as PropsSubcircuitProps,
  TraceProps as PropsTraceProps,
  ViaProps as PropsViaProps,
} from "@tscircuit/props"
import type {
  AutorouterProp,
  BoardProps,
  CadModelProps,
  CapacitorProps,
  ChipProps,
  CommonLayoutProps,
  DiodeProps,
  FootprintProps,
  GroupProps,
  HoleProps,
  ImplicitBreakoutPointSolverFn,
  InductorProps,
  LedProps,
  NetProps,
  PcbLayoutProps,
  PinLabelsProp,
  PlatedHoleProps,
  PortHints,
  ResistorProps,
  SilkscreenPathProps,
  SilkscreenTextProps,
  SmtPadProps,
  SubcircuitProps,
  TraceProps,
  ViaProps,
} from "../dist"

test("published entry point re-exports the board and breakout solver types", () => {
  expectTypeOf<BoardProps>().toEqualTypeOf<PropsBoardProps>()
  expectTypeOf<ImplicitBreakoutPointSolverFn>().toEqualTypeOf<PropsImplicitBreakoutPointSolverFn>()
  expectTypeOf<ChipProps>().toEqualTypeOf<PropsChipProps>()
  expectTypeOf<CommonLayoutProps>().toEqualTypeOf<PropsCommonLayoutProps>()
  expectTypeOf<PinLabelsProp>().toEqualTypeOf<PropsPinLabelsProp>()
})

test("published entry point re-exports standard passive and active component prop types", () => {
  expectTypeOf<ResistorProps>().toEqualTypeOf<PropsResistorProps>()
  expectTypeOf<CapacitorProps>().toEqualTypeOf<PropsCapacitorProps>()
  expectTypeOf<InductorProps>().toEqualTypeOf<PropsInductorProps>()
  expectTypeOf<DiodeProps>().toEqualTypeOf<PropsDiodeProps>()
  expectTypeOf<LedProps>().toEqualTypeOf<PropsLedProps>()
})

test("published entry point re-exports routing, connectivity, and layout prop types", () => {
  expectTypeOf<TraceProps>().toEqualTypeOf<PropsTraceProps>()
  expectTypeOf<ViaProps>().toEqualTypeOf<PropsViaProps>()
  expectTypeOf<HoleProps>().toEqualTypeOf<PropsHoleProps>()
  expectTypeOf<GroupProps>().toEqualTypeOf<PropsGroupProps>()
  expectTypeOf<NetProps>().toEqualTypeOf<PropsNetProps>()
  expectTypeOf<SubcircuitProps>().toEqualTypeOf<PropsSubcircuitProps>()
  expectTypeOf<AutorouterProp>().toEqualTypeOf<PropsAutorouterProp>()
  expectTypeOf<PcbLayoutProps>().toEqualTypeOf<PropsPcbLayoutProps>()
})

test("published entry point re-exports footprint, silkscreen, and CAD prop types", () => {
  expectTypeOf<FootprintProps>().toEqualTypeOf<PropsFootprintProps>()
  expectTypeOf<SmtPadProps>().toEqualTypeOf<PropsSmtPadProps>()
  expectTypeOf<PlatedHoleProps>().toEqualTypeOf<PropsPlatedHoleProps>()
  expectTypeOf<SilkscreenTextProps>().toEqualTypeOf<PropsSilkscreenTextProps>()
  expectTypeOf<SilkscreenPathProps>().toEqualTypeOf<PropsSilkscreenPathProps>()
  expectTypeOf<CadModelProps>().toEqualTypeOf<PropsCadModelProps>()
  expectTypeOf<PortHints>().toEqualTypeOf<PropsPortHints>()
})
