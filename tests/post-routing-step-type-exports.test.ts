import { expectTypeOf, test } from "bun:test"
import type {
  PcbCircuitElement as PropsPcbCircuitElement,
  PcbPostRoutingContext as PropsPcbPostRoutingContext,
  PcbPostRoutingElementInput as PropsPcbPostRoutingElementInput,
  PcbPostRoutingFn as PropsPcbPostRoutingFn,
  PcbPostRoutingRenderFn as PropsPcbPostRoutingRenderFn,
  PcbPostRoutingStepProps as PropsPcbPostRoutingStepProps,
} from "@tscircuit/props"
import type {
  PcbCircuitElement,
  PcbPostRoutingContext,
  PcbPostRoutingElementInput,
  PcbPostRoutingFn,
  PcbPostRoutingRenderFn,
  PcbPostRoutingStepProps,
} from "../dist"

test("published entry point re-exports the post-routing step types", () => {
  expectTypeOf<PcbPostRoutingFn>().toEqualTypeOf<PropsPcbPostRoutingFn>()
  expectTypeOf<PcbPostRoutingRenderFn>().toEqualTypeOf<PropsPcbPostRoutingRenderFn>()
  expectTypeOf<PcbPostRoutingContext>().toEqualTypeOf<PropsPcbPostRoutingContext>()
  expectTypeOf<PcbPostRoutingStepProps>().toEqualTypeOf<PropsPcbPostRoutingStepProps>()
  expectTypeOf<PcbCircuitElement>().toEqualTypeOf<PropsPcbCircuitElement>()
  expectTypeOf<PcbPostRoutingElementInput>().toEqualTypeOf<PropsPcbPostRoutingElementInput>()
})
