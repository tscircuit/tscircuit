import { createElement } from "react"

interface SerializedWorkerElement {
  __isSerializedReactElement: true
  type: string
  props: Record<string, unknown>
}

/** Decode the element format sent by @tscircuit/eval's public worker wrapper. */
export function deserializeWorkerElement(component: unknown): unknown {
  if (!isSerializedWorkerElement(component))
    return component
  const props = { ...component.props }
  if ("children" in props)
    props.children = Array.isArray(props.children)
      ? props.children.map(deserializeWorkerElement)
      : deserializeWorkerElement(props.children)
  return createElement(component.type, props)
}

function isSerializedWorkerElement(component: unknown): component is SerializedWorkerElement {
  return component !== null && typeof component === "object"
    && "__isSerializedReactElement" in component && component.__isSerializedReactElement === true
    && "type" in component && typeof component.type === "string"
    && "props" in component && component.props !== null && typeof component.props === "object"
}
