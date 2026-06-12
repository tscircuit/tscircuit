import importer, { type SupportedModuleMap } from "@tscircuit/internal-dynamic-import"

export const loadGerberConverter = (): Promise<
  SupportedModuleMap["circuit-json-to-gerber"]
> => importer("circuit-json-to-gerber")
export const loadBpcConverter = (): Promise<
  SupportedModuleMap["circuit-json-to-bpc"]
> => importer("circuit-json-to-bpc")
export const loadConnectivityMapConverter = (): Promise<
  SupportedModuleMap["circuit-json-to-connectivity-map"]
> => importer("circuit-json-to-connectivity-map")
export const loadGltfConverter = (): Promise<
  SupportedModuleMap["circuit-json-to-gltf"]
> => importer("circuit-json-to-gltf")
export const loadSimple3dConverter = (): Promise<
  SupportedModuleMap["circuit-json-to-simple-3d"]
> => importer("circuit-json-to-simple-3d")
export const loadSpiceConverter = (): Promise<
  SupportedModuleMap["circuit-json-to-spice"]
> => importer("circuit-json-to-spice")
export const loadSvgConverter = (): Promise<
  SupportedModuleMap["circuit-to-svg"]
> => importer("circuit-to-svg")
