/**
 * Preload script for registering tscircuit Bun plugins
 *
 * Usage:
 * - CLI: bun --preload ./node_modules/tscircuit/plugins/preload.ts your-file.tsx
 * - bunfig.toml:
 *   [run]
 *   preload = ["./node_modules/tscircuit/plugins/preload.ts"]
 */

import { plugin } from "bun"
import { kicadModPlugin } from "./bun-plugin-kicad-mod"

plugin(kicadModPlugin as any)
