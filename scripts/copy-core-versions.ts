import corePackageJson from "@tscircuit/core/package.json"
import currentPackageJson from "../package.json"
import { join } from "node:path"

const coreDeps: any = {
  ...corePackageJson.devDependencies,
  ...corePackageJson.dependencies,
}

const currentDeps: any = { ...currentPackageJson.dependencies }
const depsToUpdate: any = {}

let modifiedDeps = false
// Update dependencies to match core
for (const [packageName, currentVersion] of Object.entries(currentDeps)) {
  if (packageName in coreDeps && coreDeps[packageName] !== currentVersion) {
    depsToUpdate[packageName] = coreDeps[packageName as keyof typeof coreDeps]
    modifiedDeps = true
  }
}

if (modifiedDeps) {
  // Use regex to replace the dependencies in the package.json
  const packageJsonPath = join(import.meta.dirname, "../package.json")
  let packageJson = await Bun.file(packageJsonPath).text()
  for (const [packageName, version] of Object.entries(depsToUpdate)) {
    packageJson = packageJson.replace(
      new RegExp(`"${packageName}": "${currentDeps[packageName]}"(,)?`),
      `"${packageName}": "${version}"$1`
    )
  }
  await Bun.write(packageJsonPath, packageJson)
}