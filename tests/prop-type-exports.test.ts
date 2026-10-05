import { expectTypeOf, test } from "bun:test"
import type {
  BoardProps as PropsBoardProps,
  ImplicitBreakoutPointSolverFn as PropsImplicitBreakoutPointSolverFn,
} from "@tscircuit/props"
import type { BoardProps, ImplicitBreakoutPointSolverFn } from "../dist"

test("published entry point re-exports the board and breakout solver types", () => {
  expectTypeOf<BoardProps>().toEqualTypeOf<PropsBoardProps>()
  expectTypeOf<ImplicitBreakoutPointSolverFn>().toEqualTypeOf<PropsImplicitBreakoutPointSolverFn>()
})
