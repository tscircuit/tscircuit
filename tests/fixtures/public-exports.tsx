import {
  assembly,
  jscad,
  type AssemblyDeviceProps,
  type AssemblyMotorProps,
  type AssemblyPrintedPartProps,
  type BoardProps,
  type CapacitorProps,
  type ChipProps,
  type CommonComponentProps,
  type CommonLayoutProps,
  type CommonShapeProps,
  type FootprintProp,
  type PinLabelsProp,
  type ResistorProps,
  type TraceProps,
  type LocalCacheEngine,
  type SimpleRouteJson,
} from "tscircuit"

export type PublicProps = {
  device: AssemblyDeviceProps
  motor: AssemblyMotorProps
  printedPart: AssemblyPrintedPartProps
  board: BoardProps
  capacitor: CapacitorProps
  chip: ChipProps
  component: CommonComponentProps
  layout: CommonLayoutProps
  shape: CommonShapeProps
  footprint: FootprintProp
  pinLabels: PinLabelsProp
  resistor: ResistorProps
  trace: TraceProps
  cache: LocalCacheEngine
  route: SimpleRouteJson
}

export const resistor = {
  name: "R1",
  resistance: "10kohm",
  pcbX: 2,
} satisfies ResistorProps

// @ts-expect-error Common component props must retain their actual types.
export const invalidComponent: CommonComponentProps = { name: 123 }

export const device = (
  <assembly.device>
    <assembly.motor name="MOTOR" model="nema17_backfaceholes" />
    <assembly.printedpart
      name="SPACER"
      jscad={<jscad.cuboid size={[42, 42, 4]} />}
    />
  </assembly.device>
)
