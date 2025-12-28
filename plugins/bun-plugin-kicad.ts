import { plugin } from "bun";
import { parseKicadModToCircuitJson } from "kicad-component-converter";

export const kicadPlugin = {
    name: "kicad-loader",
    setup(build) {
        build.onLoad({ filter: /\.kicad_mod$/ }, async (args) => {
            const text = await Bun.file(args.path).text();
            try {
                const circuitJson = await parseKicadModToCircuitJson(text);
                return {
                    contents: `export default ${JSON.stringify(circuitJson)}`,
                    loader: "js",
                };
            } catch (e) {
                console.error(`Failed to parse KiCad mod file: ${args.path}`, e);
                throw e;
            }
        });
    },
};
