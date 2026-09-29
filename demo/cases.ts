import GUI from "lil-gui";
import * as martinez from "../index";
import type { MultiPolygon, Position } from "../index";

// Browse every test case in the repo: pick a case and an operation, see the
// inputs, the computed result and, for generic test cases, the expected one.

type Operation = "union" | "intersection" | "diff" | "xor" | "diff_ba";
const OPERATIONS: Operation[] = ["union", "intersection", "diff", "xor", "diff_ba"];

interface TestCase {
  subject: MultiPolygon;
  clipping: MultiPolygon;
  expected: Partial<Record<Operation, MultiPolygon | null>>;
  note?: string;
}

const sources = import.meta.glob<string>(
  ["../test/genericTestCases/*.geojson", "../test/fixtures/*.geojson"],
  { query: "?raw", import: "default" }
);

// Fixtures with a single feature: pair them up, or clip against a box
const PAIRS: Record<string, string> = {
  "fixtures/asia": "fixtures/asia_unionPoly",
};

const caseName = (path: string) =>
  path.replace("../test/", "").replace("genericTestCases/", "generic/").replace(".geojson", "");
const pathByName = new Map(Object.keys(sources).map((p) => [caseName(p), p]));
const names = [...pathByName.keys()].sort((a, b) =>
  a.startsWith("generic/") === b.startsWith("generic/") ? a.localeCompare(b) : a.startsWith("generic/") ? -1 : 1
);

const toMultiPolygon = (geometry: any): MultiPolygon =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

async function loadFeatures(name: string): Promise<any[]> {
  const data = JSON.parse(await sources[pathByName.get(name)!]());
  return data.type === "FeatureCollection" ? data.features : [data];
}

function centralBox(mp: MultiPolygon): MultiPolygon {
  const [x0, y0, x1, y1] = bounds([mp]);
  const dx = (x1 - x0) / 4, dy = (y1 - y0) / 4;
  return [[[[x0 + dx, y0 + dy], [x1 - dx, y0 + dy], [x1 - dx, y1 - dy], [x0 + dx, y1 - dy], [x0 + dx, y0 + dy]]]];
}

async function loadCase(name: string): Promise<TestCase> {
  const features = (await loadFeatures(name)).filter((f) => f.geometry);
  const expected: TestCase["expected"] = {};
  for (const f of features.slice(2)) {
    if (f.properties?.operation) expected[f.properties.operation as Operation] = f.geometry.coordinates;
  }
  const subject = toMultiPolygon(features[0].geometry);
  if (features.length > 1) return { subject, clipping: toMultiPolygon(features[1].geometry), expected };
  if (PAIRS[name]) {
    const other = await loadFeatures(PAIRS[name]);
    return { subject, clipping: toMultiPolygon(other[0].geometry), expected, note: `clipping: ${PAIRS[name]}` };
  }
  return { subject, clipping: centralBox(subject), expected, note: "clipping: central box of the bounds" };
}

function run(tc: TestCase, op: Operation): MultiPolygon | null {
  if (op === "diff_ba") return martinez.diff(tc.clipping, tc.subject) as MultiPolygon | null;
  return martinez[op](tc.subject, tc.clipping) as MultiPolygon | null;
}

// ---------------------------------------------------------------- drawing

const canvas = document.getElementById("view") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const statusEl = document.getElementById("status")!;

const view = { scale: 1, x: 0, y: 0 }; // screen = (world - origin) * scale, y flipped
let current: TestCase | null = null;
let result: MultiPolygon | null = null;
let mouse: Position | null = null;

function bounds(sets: (MultiPolygon | null | undefined)[]): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const mp of sets) {
    if (!mp) continue;
    for (const poly of mp) for (const ring of poly) for (const [x, y] of ring) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return [x0, y0, x1, y1];
}

function fit() {
  if (!current) return;
  const [x0, y0, x1, y1] = bounds([current.subject, current.clipping]);
  // Keep clear of the controls on the right
  const pad = 40, panel = gui.domElement.offsetWidth + pad;
  const w = canvas.clientWidth - panel, h = canvas.clientHeight;
  view.scale = Math.min((w - 2 * pad) / (x1 - x0 || 1), (h - 2 * pad) / (y1 - y0 || 1));
  view.x = (x0 + x1) / 2 - w / 2 / view.scale;
  view.y = (y0 + y1) / 2 + h / 2 / view.scale;
  draw();
}

const toScreen = (p: Position): Position => [(p[0] - view.x) * view.scale, (view.y - p[1]) * view.scale];
const toWorld = (sx: number, sy: number): Position => [sx / view.scale + view.x, view.y - sy / view.scale];

function tracePolygons(mp: MultiPolygon) {
  ctx.beginPath();
  for (const poly of mp) for (const ring of poly) {
    ring.forEach((p, i) => {
      const [x, y] = toScreen(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
}

function fillLayer(mp: MultiPolygon | null | undefined, fill: string) {
  if (!mp) return;
  tracePolygons(mp);
  ctx.fillStyle = fill;
  ctx.fill("evenodd");
}

function strokeLayer(mp: MultiPolygon | null | undefined, stroke: string, width: number, dash: number[] = []) {
  if (!mp) return;
  tracePolygons(mp);
  ctx.setLineDash(dash);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawVertices(mp: MultiPolygon | null | undefined, color: string) {
  if (!mp) return;
  ctx.fillStyle = color;
  for (const poly of mp) for (const ring of poly) for (const p of ring) {
    const [x, y] = toScreen(p);
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!current) return;

  // All fills first, so that no outline is hidden under a fill
  if (params.subject) fillLayer(current.subject, "rgba(37, 99, 235, 0.12)");
  if (params.clipping) fillLayer(current.clipping, "rgba(220, 38, 38, 0.12)");
  if (params.result) fillLayer(result, "rgba(22, 163, 74, 0.35)");
  if (params.result) strokeLayer(result, "#15803d", 2);
  if (params.subject) strokeLayer(current.subject, "#2563eb", 1);
  if (params.clipping) strokeLayer(current.clipping, "#dc2626", 1);
  if (params.expected) strokeLayer(current.expected[params.operation], "#7c3aed", 2, [6, 4]);
  if (params.vertices) {
    if (params.subject) drawVertices(current.subject, "#2563eb");
    if (params.clipping) drawVertices(current.clipping, "#dc2626");
    if (params.result) drawVertices(result, "#15803d");
  }
  updateStatus();
}

// ---------------------------------------------------------------- state

const params = {
  case: names[0],
  operation: "union" as Operation,
  subject: true,
  clipping: true,
  result: true,
  expected: true,
  vertices: false,
  fit,
  previous: () => step(-1),
  next: () => step(1),
  copyResult: () => navigator.clipboard.writeText(JSON.stringify(result)),
};

const info = { time: "", output: "", expected: "" };

function countRings(mp: MultiPolygon | null) {
  if (!mp) return "null";
  let rings = 0, vertices = 0;
  for (const poly of mp) for (const ring of poly) { rings++; vertices += ring.length; }
  return `${mp.length} polygons, ${rings} rings, ${vertices} vertices`;
}

function compute() {
  if (!current) return;
  const t0 = performance.now();
  try {
    result = run(current, params.operation);
    info.output = countRings(result);
  } catch (e) {
    result = null;
    info.output = `threw: ${(e as Error).message}`;
  }
  info.time = `${(performance.now() - t0).toFixed(2)} ms`;
  const exp = current.expected[params.operation];
  info.expected = exp === undefined
    ? "no expectation"
    : JSON.stringify(exp) === JSON.stringify(result) ? "✓ matches" : "✗ differs";
  gui.controllersRecursive().forEach((c) => c.updateDisplay());
  const hash = `#${encodeURIComponent(params.case)}/${params.operation}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);
  draw();
}

function updateStatus() {
  const lines = [`${params.case}  ·  ${params.operation}`];
  if (current?.note) lines.push(current.note);
  lines.push(`${info.time}  ·  ${info.output}  ·  ${info.expected}`);
  if (mouse) lines.push(`x ${mouse[0].toPrecision(10)}  y ${mouse[1].toPrecision(10)}`);
  statusEl.textContent = lines.join("\n");
}

let loading = 0;
async function selectCase(name: string, keepOperation = false) {
  const token = ++loading;
  const tc = await loadCase(name);
  if (token !== loading) return; // a newer selection won
  current = tc;
  // Switch to an operation the case has an expectation for
  const ops = Object.keys(tc.expected) as Operation[];
  if (!keepOperation && ops.length && !ops.includes(params.operation)) params.operation = ops[0];
  fit();
  compute();
}

function step(delta: number) {
  const i = names.indexOf(params.case);
  params.case = names[(i + delta + names.length) % names.length];
  selectCase(params.case);
}

// ---------------------------------------------------------------- GUI

const gui = new GUI({ title: "Martinez test cases" });
// Give focus back to the page after picking from a dropdown, otherwise the
// arrow keys keep changing the dropdown instead of navigating cases
const blur = () => (document.activeElement as HTMLElement | null)?.blur();
gui.add(params, "case", names).name("test case").onChange((name: string) => { blur(); selectCase(name); });
gui.add(params, "operation", OPERATIONS).onChange(() => { blur(); compute(); });
const nav = gui.addFolder("Navigate");
nav.add(params, "previous").name("← previous case");
nav.add(params, "next").name("next case →");
nav.add(params, "fit").name("fit view");
const layers = gui.addFolder("Layers");
for (const key of ["subject", "clipping", "result", "expected", "vertices"] as const) {
  layers.add(params, key).onChange(draw);
}
const out = gui.addFolder("Result");
out.add(info, "time").disable();
out.add(info, "output").disable();
out.add(info, "expected").disable();
out.add(params, "copyResult").name("copy result JSON");

// ---------------------------------------------------------------- input

let drag: { x: number; y: number } | null = null;
canvas.addEventListener("pointerdown", (e) => {
  blur();
  drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add("dragging");
});
canvas.addEventListener("pointermove", (e) => {
  mouse = toWorld(e.offsetX, e.offsetY);
  if (drag) {
    view.x -= (e.clientX - drag.x) / view.scale;
    view.y += (e.clientY - drag.y) / view.scale;
    drag = { x: e.clientX, y: e.clientY };
    draw();
  } else {
    updateStatus();
  }
});
canvas.addEventListener("pointerup", () => {
  drag = null;
  canvas.classList.remove("dragging");
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const [wx, wy] = toWorld(e.offsetX, e.offsetY);
  view.scale *= Math.exp(-e.deltaY * 0.002);
  view.x = wx - e.offsetX / view.scale;
  view.y = wy + e.offsetY / view.scale;
  draw();
}, { passive: false });
window.addEventListener("keydown", (e) => {
  if (e.target instanceof Element && e.target.closest(".lil-gui")) return;
  if (e.key === "ArrowLeft") step(-1);
  else if (e.key === "ArrowRight") step(1);
  else if (e.key === "f") fit();
  else if (e.key >= "1" && e.key <= "5") {
    params.operation = OPERATIONS[Number(e.key) - 1];
    compute();
  }
});
window.addEventListener("resize", draw);

// Selection lives in the URL, e.g. #generic%2Fissue155/union
function selectFromHash() {
  const [hashCase, hashOp] = location.hash.slice(1).split("/").map(decodeURIComponent);
  if (hashCase && pathByName.has(hashCase)) params.case = hashCase;
  if (OPERATIONS.includes(hashOp as Operation)) params.operation = hashOp as Operation;
  selectCase(params.case, Boolean(hashOp));
}
window.addEventListener("hashchange", selectFromHash);
selectFromHash();
