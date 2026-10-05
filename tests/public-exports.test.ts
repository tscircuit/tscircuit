import { expect, test } from "bun:test"
import { createRequire } from "node:module"
import { commonComponentProps, commonLayoutProps, resistorProps } from "tscircuit"

test("package entry point exposes common and component prop schemas", () => {
  expect(commonLayoutProps.parse({ pcbX: "2mm" }).pcbX).toBe(2)
  expect(commonComponentProps.parse({ name: "R1" }).name).toBe("R1")
  expect(
    resistorProps.parse({ name: "R1", resistance: "10kohm" }).resistance,
  ).toBe(10000)
})

test("package entry point exposes typed assembly, jscad, and public props", () => {
  const require = createRequire(import.meta.url)
  const result = Bun.spawnSync(
    [
      "node",
      require.resolve("typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--target",
      "ESNext",
      "--module",
      "ESNext",
      "--moduleResolution",
      "bundler",
      "--jsx",
      "react-jsx",
      "tests/fixtures/public-exports.tsx",
    ],
    { cwd: new URL("..", import.meta.url).pathname },
  )

  expect(
    result.exitCode,
    result.stdout.toString() + result.stderr.toString(),
  ).toBe(0)
}, 30_000)
