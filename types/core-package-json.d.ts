declare module "@tscircuit/core/package.json" {
  const value: {
    version?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    [key: string]: unknown
  }
  export default value
}
