import type { MultiPolygon, Position } from "../index";

// The test cases of the repository, for the case viewer and the playground:
// every generic test case and fixture, plus a synthetic stress test.

export type Operation = "union" | "intersection" | "diff" | "xor" | "diff_ba";
export const OPERATIONS: Operation[] = ["union", "intersection", "diff", "xor", "diff_ba"];

export interface TestCase {
  subject: MultiPolygon;
  clipping: MultiPolygon;
  expected: Partial<Record<Operation, MultiPolygon | null>>;
  note?: string;
}

const sources = import.meta.glob<string>(
  ["../test/genericTestCases/*.geojson", "../test/fixtures/*.geojson"],
  { query: "?raw", import: "default" },
);

// Fixtures with a single feature: pair them up, or clip against a box
const PAIRS: Record<string, string> = {
  "fixtures/asia": "fixtures/asia_unionPoly",
};

const caseName = (path: string) =>
  path.replace("../test/", "").replace("genericTestCases/", "generic/").replace(".geojson", "");
const pathByName = new Map(Object.keys(sources).map((p) => [caseName(p), p]));
// Stress test: Asia against a copy of itself shifted east
export const SHIFTED = "synthetic/asia shifted";
export const names = [
  ...[...pathByName.keys()].sort((a, b) =>
    a.startsWith("generic/") === b.startsWith("generic/")
      ? a.localeCompare(b)
      : a.startsWith("generic/")
        ? -1
        : 1,
  ),
  SHIFTED,
];

export const toMultiPolygon = (geometry: any): MultiPolygon =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

async function loadFeatures(name: string): Promise<any[]> {
  const data = JSON.parse(await sources[pathByName.get(name)!]());
  return data.type === "FeatureCollection" ? data.features : [data];
}

export function centralBox(mp: MultiPolygon): MultiPolygon {
  const [x0, y0, x1, y1] = bounds([mp]);
  const dx = (x1 - x0) / 4,
    dy = (y1 - y0) / 4;
  return [
    [
      [
        [x0 + dx, y0 + dy],
        [x1 - dx, y0 + dy],
        [x1 - dx, y1 - dy],
        [x0 + dx, y1 - dy],
        [x0 + dx, y0 + dy],
      ],
    ],
  ];
}

export const shiftBy = (mp: MultiPolygon, dx: number): MultiPolygon =>
  mp.map((polygon) => polygon.map((ring) => ring.map(([x, y]) => [x + dx, y] as Position)));

export async function loadCase(name: string, shift = 0.05): Promise<TestCase> {
  if (name === SHIFTED) {
    const subject = toMultiPolygon((await loadFeatures("fixtures/asia"))[0].geometry);
    return {
      subject,
      clipping: shiftBy(subject, shift),
      expected: {},
      note: "clipping: fixtures/asia shifted east (use the shift slider)",
    };
  }
  const features = (await loadFeatures(name)).filter((f) => f.geometry);
  const expected: TestCase["expected"] = {};
  for (const f of features.slice(2)) {
    if (f.properties?.operation)
      expected[f.properties.operation as Operation] = f.geometry.coordinates;
  }
  const subject = toMultiPolygon(features[0].geometry);
  if (features.length > 1)
    return { subject, clipping: toMultiPolygon(features[1].geometry), expected };
  if (PAIRS[name]) {
    const other = await loadFeatures(PAIRS[name]);
    return {
      subject,
      clipping: toMultiPolygon(other[0].geometry),
      expected,
      note: `clipping: ${PAIRS[name]}`,
    };
  }
  return {
    subject,
    clipping: centralBox(subject),
    expected,
    note: "clipping: central box of the bounds",
  };
}

export function bounds(
  sets: (MultiPolygon | null | undefined)[],
): [number, number, number, number] {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const mp of sets) {
    if (!mp) continue;
    for (const poly of mp)
      for (const ring of poly)
        for (const [x, y] of ring) {
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        }
  }
  return [x0, y0, x1, y1];
}
