import { expectTypeOf, test } from "bun:test"
import type {
  PcbCircuitElement as PropsPcbCircuitElement,
  PcbPostRoutingHook as PropsPcbPostRoutingHook,
  PcbPostRoutingHookContext as PropsPcbPostRoutingHookContext,
  PcbPostRoutingHookElementInput as PropsPcbPostRoutingHookElementInput,
} from "@tscircuit/props"
import type {
  PcbCircuitElement,
  PcbPostRoutingHook,
  PcbPostRoutingHookContext,
  PcbPostRoutingHookElementInput,
} from "../dist"

test("published entry point re-exports the post-routing hook types", () => {
  expectTypeOf<PcbPostRoutingHook>().toEqualTypeOf<PropsPcbPostRoutingHook>()
  expectTypeOf<PcbPostRoutingHookContext>().toEqualTypeOf<PropsPcbPostRoutingHookContext>()
  expectTypeOf<PcbCircuitElement>().toEqualTypeOf<PropsPcbCircuitElement>()
  expectTypeOf<PcbPostRoutingHookElementInput>().toEqualTypeOf<PropsPcbPostRoutingHookElementInput>()
})
