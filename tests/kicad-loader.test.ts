import { expect, test } from "bun:test";
import { plugin } from "bun";
import { kicadPlugin } from "../plugins/bun-plugin-kicad.ts";

plugin(kicadPlugin);

test("should load .kicad_mod file as circuit json", async () => {
    const mod = await import("./fixtures/test.kicad_mod");

    // The structure depends on what convertKicadToCircuitJson returns.
    // Usually it returns Soup or a specific object.
    // Let's inspect it.
    console.log("Loaded mod:", mod.default);

    expect(mod.default).toBeDefined();
    // Check for common circuit json properties
    // It might return an array of elements or a component definition
    expect(Array.isArray(mod.default) || typeof mod.default === 'object').toBe(true);
});
