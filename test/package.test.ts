// Installs the packed package (`npm pack`) into a scratch project and uses it
// the way consumers do. Each check runs in a separate `node` or `tsc` process:
// importing the package here would go through Vite's resolver, not Node's.
// Needs a build first; run with `npm run check:package`.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const shell = process.platform === "win32";
let dir: string;

const run = (command: string, args: string[], cwd = dir) =>
  execFileSync(command, args, { cwd, encoding: "utf8", shell, stdio: "pipe" });
const node = (file: string, source: string) => {
  writeFileSync(join(dir, file), source);
  return run(process.execPath, [file]);
};
const tsc = (file: string, source: string) => {
  writeFileSync(join(dir, file), source);
  const bin = join(dir, "node_modules", "typescript", "bin", "tsc");
  return run(process.execPath, [bin, "--noEmit", "--strict", "--module", "nodenext", file]);
};

const usage = `
const a = [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]];
const b = [[[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]];
console.log(JSON.stringify(intersection(a, b)));
`;
const expected = [
  [
    [
      [1, 1],
      [2, 1],
      [2, 2],
      [1, 2],
      [1, 1],
    ],
  ],
];
const types = `import { intersection, type MultiPolygon } from "martinez-polygon-clipping";
const result: MultiPolygon = intersection([[[0, 0], [1, 0], [1, 1], [0, 0]]], []);
`;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "martinez-package-"));
  const [{ filename }] = JSON.parse(
    run("npm", ["pack", "--json", "--pack-destination", dir], root),
  );
  writeFileSync(join(dir, "package.json"), '{ "private": true }');
  run("npm", ["install", "--no-audit", "--no-fund", join(dir, filename), "typescript@5"]);
}, 120_000);

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("packed package", () => {
  it("works with import", () => {
    const out = node(
      "esm.mjs",
      `import { intersection } from "martinez-polygon-clipping";${usage}`,
    );
    expect(JSON.parse(out)).toEqual(expected);
  });

  it("works with require", () => {
    const out = node(
      "cjs.cjs",
      `const { intersection } = require("martinez-polygon-clipping");${usage}`,
    );
    expect(JSON.parse(out)).toEqual(expected);
  });

  it("has types for import", () => {
    expect(() => tsc("esm.mts", types)).not.toThrow();
  });

  it("has types for require", () => {
    expect(() => tsc("cjs.cts", types)).not.toThrow();
  });
});
