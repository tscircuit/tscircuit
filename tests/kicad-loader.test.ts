import { expect, test } from "bun:test";
import { plugin } from "bun";
import { kicadPlugin } from "../plugins/bun-plugin-kicad.ts";

plugin(kicadPlugin);

import { parseKicadModToCircuitJson } from "kicad-component-converter";

test("should load .kicad_mod file as string via plugin", async () => {
    const mod = await import("./fixtures/test.kicad_mod");
    console.log("Loaded mod type:", typeof mod.default);
    expect(typeof mod.default).toBe("string");
    expect(mod.default).toContain("(module");
});

test("should be parseable by kicad-component-converter", async () => {
    const mod = await import("./fixtures/test.kicad_mod");
    const result = await parseKicadModToCircuitJson(mod.default);
    expect(result).toBeDefined();
    expect(Array.isArray(result) || typeof result === 'object').toBe(true);
});
