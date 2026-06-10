import importer from "@tscircuit/internal-dynamic-import"

export const loadGerberConverter = () => importer("circuit-json-to-gerber")
export const loadBpcConverter = () => importer("circuit-json-to-bpc")
export const loadConnectivityMapConverter = () =>
  importer("circuit-json-to-connectivity-map")
export const loadGltfConverter = () => importer("circuit-json-to-gltf")
export const loadSimple3dConverter = () => importer("circuit-json-to-simple-3d")
export const loadSpiceConverter = () => importer("circuit-json-to-spice")
export const loadSvgConverter = () => importer("circuit-to-svg")
