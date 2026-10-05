import { expect, test } from "bun:test"
import { createRequire } from "node:module"

test("package entry point exposes assembly, jscad, and BoardProps", () => {
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
