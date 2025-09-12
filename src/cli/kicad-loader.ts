// KiCad .kicad_mod custom loader for Bun
// Usage: bun --loader ./src/cli/kicad-loader.ts your-app.ts
// Supports: import kicadMod from "./footprint.kicad_mod"

import type { Plugin } from 'bun';
import { resolveFileImport } from '../props';

const kicadPlugin: Plugin = {
  name: 'kicad-loader',
  setup(build) {
    build.onLoad({ filter: /\.kicad_mod$/ }, async ({ path }) => {
      try {
        const circuitJson = await resolveFileImport(path, undefined);
        
        return {
          contents: `
            // Auto-generated from ${path}
            export default ${JSON.stringify(circuitJson)};
            export const footprintCircuitJson = ${JSON.stringify(circuitJson)};
          `,
          loader: 'js',
        };
      } catch (error) {
        return {
          errors: [new Error(`Failed to load KiCad module ${path}: ${error}`)],
        };
      }
    });
  },
};

export default kicadPlugin;
