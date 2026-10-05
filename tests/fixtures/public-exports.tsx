import { assembly, jscad, type BoardProps } from "tscircuit"

export const boardProps = {
  name: "CONTROLLER",
  width: 42,
  height: 42,
} satisfies BoardProps

// @ts-expect-error Board props must retain their actual types.
export const invalidBoardProps: BoardProps = { width: false }

export const device = (
  <assembly.device>
    <assembly.motor name="MOTOR" model="nema17_backfaceholes" />
    <assembly.printedpart
      name="SPACER"
      jscad={<jscad.cuboid size={[42, 42, 4]} />}
    />
    <board {...boardProps} />
  </assembly.device>
)
