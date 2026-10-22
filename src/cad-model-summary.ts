import type { CadComponent, CircuitJson } from "circuit-json"

export interface CadModelItem {
  cadComponentId: string
  sourceComponentId?: string
  format: "step" | "stl" | "gltf" | "obj" | "jscad" | "unknown"
  modelUrl?: string
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
}

export interface CadModelSummary {
  models: CadModelItem[]
  totalCadModels: number
  modelsByFormat: Record<string, number>
}

function detectCadFormat(
  cadComp: any,
): "step" | "stl" | "gltf" | "obj" | "jscad" | "unknown" {
  const url: string =
    cadComp.model_url ||
    cadComp.model_obj_url ||
    cadComp.model_stl_url ||
    cadComp.model_step_url ||
    ""

  const lower = url.toLowerCase()
  if (
    lower.endsWith(".step") ||
    lower.endsWith(".stp") ||
    cadComp.model_step_url
  )
    return "step"
  if (lower.endsWith(".stl") || cadComp.model_stl_url) return "stl"
  if (lower.endsWith(".gltf") || lower.endsWith(".glb")) return "gltf"
  if (lower.endsWith(".obj") || cadComp.model_obj_url) return "obj"
  if (cadComp.jscad || cadComp.model_jscad) return "jscad"
  return "unknown"
}

/**
 * Summarizes 3D CAD models, file formats, and spatial positions in a circuit.
 */
export function getCadModelSummary(circuitJson: CircuitJson): CadModelSummary {
  if (!Array.isArray(circuitJson)) {
    return { models: [], totalCadModels: 0, modelsByFormat: {} }
  }

  const models: CadModelItem[] = []
  const modelsByFormat: Record<string, number> = {}

  for (const element of circuitJson) {
    if (element.type === "cad_component") {
      const cad = element as CadComponent
      const format = detectCadFormat(cad)
      modelsByFormat[format] = (modelsByFormat[format] || 0) + 1

      const modelUrl =
        (cad as any).model_url ||
        (cad as any).model_step_url ||
        (cad as any).model_stl_url ||
        (cad as any).model_obj_url

      models.push({
        cadComponentId: cad.cad_component_id,
        sourceComponentId: cad.source_component_id,
        format,
        modelUrl,
        position: cad.position,
        rotation: cad.rotation,
      })
    }
  }

  return {
    models,
    totalCadModels: models.length,
    modelsByFormat,
  }
}
