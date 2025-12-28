import { plugin } from "bun";
// import { parseKicadModToCircuitJson } from "kicad-component-converter";

export const kicadPlugin = {
    name: "kicad-loader",
    setup(build) {
        build.onLoad({ filter: /\.kicad_mod$/ }, async (args) => {
            const text = await Bun.file(args.path).text();
            return {
                // Export as a string (which will be treated as a URL/content by the updated architecture)
                contents: `export default ${JSON.stringify(text)}`,
                loader: "js",
            };
        });
    },
};
