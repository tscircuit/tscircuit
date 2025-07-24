#!/usr/bin/env bun

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const packageJsonPath = path.join(__dirname, '..', 'package.json')
const originalPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const libonlyPackage = {
  ...originalPackage,
  version: `${originalPackage.version}-libonly`,
  dependencies: {
    ...originalPackage.dependencies
  },
  files: originalPackage.files.filter(file => file !== 'cli.mjs')
}

delete libonlyPackage.dependencies['@tscircuit/cli']
delete libonlyPackage.bin

const libonlyPackageJsonPath = path.join(__dirname, '..', 'package-libonly.json')
fs.writeFileSync(libonlyPackageJsonPath, JSON.stringify(libonlyPackage, null, 2))

console.log('Created package-libonly.json')