import type { CircuitJson } from "circuit-json"
import {
  FileTypeHandler,
  PlatformConfig,
  defaultFileTypeHandlers,
  getFileTypeHandlers,
  findHandlerForExtension,
  processFileWithHandler,
  importFile,
  createFileModuleLoader,
  createKicadImportPlugin,
  registerKicadPlugin
} from "./index"

console.log("✅ All exports imported successfully")
console.log("✅ Default handlers:", defaultFileTypeHandlers.length)

const testConfig: PlatformConfig = {
  filetypeHandlers: [
    {
      extensions: ["test"],
      handler: async (content: string) => ({ type: "test" } as CircuitJson)
    }
  ]
}

const allHandlers = getFileTypeHandlers(testConfig)
console.log("✅ Total handlers:", allHandlers.length)

const kicadHandler = findHandlerForExtension("kicad_mod")
console.log("✅ KiCad handler found:", !!kicadHandler)

console.log("🎉 All basic functionality tests passed!")
