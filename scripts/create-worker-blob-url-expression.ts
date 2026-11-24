export function createWorkerBlobUrlExpression(base64Worker: string): string {
  return `URL.createObjectURL(new Blob([Uint8Array.from(atob(\"${base64Worker}\"), (char) => char.charCodeAt(0))], { type: 'application/javascript' }))`
}
