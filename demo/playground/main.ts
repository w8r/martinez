import type { MultiPolygon, Position } from "../../index";
import { centralBox, loadCase, names, SHIFTED } from "../case-data";
import {
  clip,
  cssColor,
  fitCanvas,
  formatMs,
  OP_NAMES,
  plural,
  polygon,
  star,
  stats,
  timed,
  tracePath,
} from "../landing/shared";
import type { Op, Pt } from "../landing/shared";

// Full-page editor: two shapes, A and B, edited in place, and the result of
// the selected operation, recomputed on every change.

type Shape = Pt[][][]; // polygons → rings → vertices, rings not closed

const OPS: Op[] = ["union", "intersection", "diff", "diff_ba", "xor"];
const DEMO = "demo/star and frame";
const CUSTOM = "custom/pasted GeoJSON";

const canvas = document.getElementById("view") as HTMLCanvasElement;
const panel = document.getElementById("panel")!;
const select = document.getElementById("case") as HTMLSelectElement;
const noteEl = document.getElementById("note")!;
const readout = document.getElementById("readout")!;
const coordsEl = document.getElementById("coords")!;
const opButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-op]")];

const colors = {
  a: cssColor("--a"),
  b: cssColor("--b"),
  result: cssColor("--accent"),
  bg: cssColor("--bg"),
  grid: "rgba(255, 255, 255, 0.07)",
};

// ── State ────────────────────────────────────────────────────
let caseName = DEMO;
let op: Op = "intersection";
let shapes: [Shape, Shape] = [[], []];
let original: [Shape, Shape] = [[], []];
let result: MultiPolygon = [];
let resultMs = 0;
let dirty = true;

// World → CSS pixels: x right, y up
const view = { x: 0, y: 0, scale: 1 }; // world coordinates of the top-left corner
const sx = (x: number) => (x - view.x) * view.scale;
const sy = (y: number) => (view.y - y) * view.scale;
const wx = (px: number) => view.x + px / view.scale;
const wy = (py: number) => view.y - py / view.scale;

function fromMultiPolygon(mp: MultiPolygon): Shape {
  return mp
    .map((poly) =>
      poly
        .map((ring) => {
          const pts = ring.map(([x, y]) => [x, y] as Pt);
          const [first, last] = [pts[0], pts[pts.length - 1]];
          if (pts.length > 1 && first[0] === last[0] && first[1] === last[1]) pts.pop();
          return pts;
        })
        // Degenerate rings stay: some test cases are about them
        .filter((ring) => ring.length > 0),
    )
    .filter((poly) => poly.length > 0);
}

const geometry = (shape: Shape): MultiPolygon =>
  shape.map((poly) => poly.map((ring) => [...ring, ring[0]] as Position[]));

const clone = (shape: Shape): Shape =>
  shape.map((poly) => poly.map((ring) => ring.map((p) => [...p] as Pt)));

function demoShapes(): [Shape, Shape] {
  const flip = (ring: Pt[]) => ring.map(([x, y]) => [x - 0.5, -y] as Pt);
  const a: Shape = [[flip(star(7, 1, 0.55)), flip(polygon(7, 0.27, Math.PI / 2).reverse())]];
  const turn = (ring: Pt[]) =>
    ring.map(([x, y]) => {
      const c = Math.cos(0.3),
        s = Math.sin(0.3);
      return [0.6 + x * c - y * s, 0.05 + x * s + y * c] as Pt;
    });
  const b: Shape = [
    [turn(polygon(4, 0.95, Math.PI / 4)), turn(polygon(4, 0.5, Math.PI / 4).reverse())],
  ];
  return [a, b];
}

// ── Loading ──────────────────────────────────────────────────
function setShapes(a: Shape, b: Shape, note = "") {
  shapes = [a, b];
  original = [clone(a), clone(b)];
  noteEl.textContent = note;
  resultMs = 0;
  // Forget hits into the previous shapes
  hover = null;
  drag = null;
  handleRings = [];
  fit();
  schedule(true);
}

async function selectCase(name: string) {
  caseName = name;
  select.value = name;
  updateHash();
  if (name === DEMO) {
    setShapes(...demoShapes());
    return;
  }
  readout.textContent = "loading…";
  const tc = await loadCase(name, 0.3);
  if (caseName !== name) return; // another case was picked meanwhile
  const note = name === SHIFTED ? "B: A shifted 0.3° east" : (tc.note ?? "");
  setShapes(fromMultiPolygon(tc.subject), fromMultiPolygon(tc.clipping), note);
}

function polygonsIn(json: any): MultiPolygon[] {
  if (!json || typeof json !== "object") return [];
  switch (json.type) {
    case "FeatureCollection":
      return json.features.flatMap(polygonsIn);
    case "Feature":
      return polygonsIn(json.geometry);
    case "GeometryCollection":
      return json.geometries.flatMap(polygonsIn);
    case "Polygon":
      return [[json.coordinates]];
    case "MultiPolygon":
      return [json.coordinates];
    default:
      return [];
  }
}

function loadGeoJSON(text: string) {
  let found: MultiPolygon[];
  try {
    found = polygonsIn(JSON.parse(text));
  } catch {
    return false;
  }
  if (!found.length) return false;
  if (!select.querySelector(`option[value="${CUSTOM}"]`)) select.add(new Option(CUSTOM, CUSTOM), 0);
  caseName = CUSTOM;
  select.value = CUSTOM;
  updateHash();
  const [a, b] = found;
  setShapes(
    fromMultiPolygon(a),
    fromMultiPolygon(b ?? centralBox(a)),
    b ? "" : "B: central box of the bounds of A",
  );
  return true;
}

// ── View ─────────────────────────────────────────────────────
/** The part of the canvas not covered by the panel */
function freeArea() {
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  const p = panel.getBoundingClientRect();
  return p.top > h / 2
    ? { left: 0, top: 48, right: w, bottom: p.top }
    : { left: 0, top: 48, right: p.left, bottom: h };
}

function fit() {
  const all = [...shapes[0], ...shapes[1]].flat(2);
  if (!all.length) return;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of all) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const area = freeArea(),
    pad = 32;
  const w = area.right - area.left - 2 * pad,
    h = area.bottom - area.top - 2 * pad;
  view.scale = Math.min(w / (x1 - x0 || 1), h / (y1 - y0 || 1));
  view.x = (x0 + x1) / 2 - (area.left + area.right) / 2 / view.scale;
  view.y = (y0 + y1) / 2 + (area.top + area.bottom) / 2 / view.scale;
  dirty = true;
  schedule();
}

function zoomAt(px: number, py: number, factor: number) {
  const x = wx(px),
    y = wy(py);
  view.scale *= factor;
  view.x = x - px / view.scale;
  view.y = y + py / view.scale;
  dirty = true;
  schedule();
}

// ── Drawing ──────────────────────────────────────────────────
interface Hit {
  shape: number;
  poly?: number;
  ring?: number;
  vertex?: number;
}

let hover: Hit | null = null;
// Rings whose vertices are far enough apart on screen to show handles
let handleRings: { shape: number; poly: number; ring: number }[] = [];

function updateHandles() {
  handleRings = [];
  shapes.forEach((shape, s) =>
    shape.forEach((poly, p) =>
      poly.forEach((ring, r) => {
        let x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity;
        for (const [x, y] of ring) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
        const perimeter = 2 * (x1 - x0 + y1 - y0) * view.scale;
        if (perimeter / ring.length > 14) handleRings.push({ shape: s, poly: p, ring: r });
      }),
    ),
  );
}

function niceStep(minPx: number) {
  const raw = minPx / view.scale;
  const pow = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (pow * m >= raw) return pow * m;
  return pow * 10;
}

function draw() {
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);

  const step = niceStep(28);
  ctx.fillStyle = colors.grid;
  for (let x = Math.ceil(wx(0) / step) * step; sx(x) < w; x += step)
    for (let y = Math.floor(wy(0) / step) * step; sy(y) < h; y -= step)
      ctx.fillRect(sx(x) - 0.75, sy(y) - 0.75, 1.5, 1.5);

  const geoms = shapes.map(geometry);
  const shapeColors = [colors.a, colors.b];
  const vertexCount = geoms.reduce((n, g) => n + stats(g).vertices, 0);
  const thin = vertexCount > 5000;
  ctx.lineJoin = "round";

  geoms.forEach((g, i) => {
    ctx.beginPath();
    tracePath(ctx, g, sx, sy);
    ctx.fillStyle = shapeColors[i] + "1c";
    ctx.fill("evenodd");
  });

  ctx.beginPath();
  tracePath(ctx, result, sx, sy);
  ctx.fillStyle = colors.result + "8c";
  ctx.fill("evenodd");
  ctx.lineWidth = thin ? 1 : 2;
  ctx.strokeStyle = colors.result;
  ctx.stroke();

  geoms.forEach((g, i) => {
    const active = (drag ?? hover)?.shape === i;
    ctx.beginPath();
    tracePath(ctx, g, sx, sy);
    ctx.lineWidth = thin ? 0.75 : active ? 1.75 : 1.25;
    ctx.strokeStyle = shapeColors[i] + (active ? "" : "b0");
    ctx.stroke();
  });

  const hot = drag ?? hover;
  for (const { shape, poly, ring } of handleRings) {
    const pts = shapes[shape][poly]?.[ring];
    if (!pts) continue;
    for (let v = 0; v < pts.length; v++) {
      const isHot =
        hot?.shape === shape && hot.poly === poly && hot.ring === ring && hot.vertex === v;
      ctx.beginPath();
      ctx.arc(sx(pts[v][0]), sy(pts[v][1]), isHot ? 5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isHot ? shapeColors[shape] : colors.bg;
      ctx.fill();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = shapeColors[shape];
      ctx.stroke();
    }
  }

  // Labels above the topmost vertex of each shape
  ctx.font = "600 12px ui-monospace, Menlo, monospace";
  ctx.textAlign = "center";
  shapes.forEach((shape, i) => {
    let top: Pt | null = null;
    for (const poly of shape) for (const p of poly[0]) if (!top || p[1] > top[1]) top = p;
    if (!top) return;
    ctx.fillStyle = shapeColors[i];
    ctx.fillText(i ? "B" : "A", sx(top[0]), sy(top[1]) - 10);
  });
}

function updateReadout() {
  const s = stats(result);
  const call = op === "diff_ba" ? "diff(B, A)" : `${OP_NAMES[op]}(A, B)`;
  const inputs = shapes.map((shape) => stats(geometry(shape)).vertices);
  const shape = s.polygons
    ? `${plural(s.polygons, "polygon")}, ${plural(s.holes, "hole")}, ${plural(s.vertices, "vertex")}`
    : "empty";
  readout.innerHTML =
    `<code>${call}</code> → ${shape}<br>` +
    `A ${inputs[0].toLocaleString("en-US")} + B ${inputs[1].toLocaleString("en-US")} vertices in ${formatMs(resultMs)}`;
}

// ── Loop ─────────────────────────────────────────────────────
let frame = 0;
let geometryChanged = true;

function schedule(changed = false) {
  if (changed) geometryChanged = true;
  dirty = true;
  if (!frame) frame = requestAnimationFrame(tick);
}

function tick() {
  frame = 0;
  if (!dirty) return;
  dirty = false;
  // Nothing to compute before the first case has loaded
  if (geometryChanged && shapes[0].length && shapes[1].length) {
    geometryChanged = false;
    const [a, b] = shapes.map(geometry);
    try {
      const run = timed(() => clip(op, a, b), 1);
      result = run.result;
      resultMs = resultMs ? resultMs * 0.8 + run.ms * 0.2 : run.ms;
      updateReadout();
    } catch (err) {
      // Edited or pasted input can hit a bug: show it rather than a stale result
      result = [];
      readout.innerHTML = `<code>${err instanceof Error ? err.message : String(err)}</code>`;
      console.error(err);
    }
  }
  updateHandles();
  draw();
}

// ── Hit testing ──────────────────────────────────────────────
function contains(shape: Shape, x: number, y: number) {
  let inside = false;
  for (const poly of shape)
    for (const ring of poly)
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i],
          [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
  return inside;
}

function hitVertex(px: number, py: number, radius: number): Hit | null {
  let best: Hit | null = null,
    bestD = radius;
  for (const { shape, poly, ring } of handleRings) {
    const pts = shapes[shape][poly]?.[ring];
    if (!pts) continue;
    for (let v = 0; v < pts.length; v++) {
      const d = Math.hypot(sx(pts[v][0]) - px, sy(pts[v][1]) - py);
      if (d <= bestD) {
        bestD = d;
        best = { shape, poly, ring, vertex: v };
      }
    }
  }
  return best;
}

function hitEdge(px: number, py: number, radius: number) {
  let best: (Hit & { at: Pt }) | null = null,
    bestD = radius;
  for (const { shape, poly, ring } of handleRings) {
    const pts = shapes[shape][poly]?.[ring];
    if (!pts) continue;
    for (let v = 0; v < pts.length; v++) {
      const a = pts[v],
        b = pts[(v + 1) % pts.length];
      const ax = sx(a[0]),
        ay = sy(a[1]),
        bx = sx(b[0]),
        by = sy(b[1]);
      const len2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / len2));
      const d = Math.hypot(ax + t * (bx - ax) - px, ay + t * (by - ay) - py);
      if (d <= bestD) {
        bestD = d;
        best = {
          shape,
          poly,
          ring,
          vertex: v + 1,
          at: [wx(ax + t * (bx - ax)), wy(ay + t * (by - ay))],
        };
      }
    }
  }
  return best;
}

function hitTest(px: number, py: number, radius: number): Hit | null {
  const vertex = hitVertex(px, py, radius);
  if (vertex) return vertex;
  // B is drawn on top, so it wins
  for (let i = 1; i >= 0; i--) if (contains(shapes[i], wx(px), wy(py))) return { shape: i };
  return null;
}

// ── Pointer input ────────────────────────────────────────────
type Drag = Hit & { lastX: number; lastY: number; pan?: boolean };
let drag: Drag | null = null;
const pointers = new Map<number, { x: number; y: number }>();
let pinch: { dist: number; cx: number; cy: number } | null = null;

const local = (e: { clientX: number; clientY: number }) => {
  const box = canvas.getBoundingClientRect();
  return [e.clientX - box.left, e.clientY - box.top] as const;
};

function pinchState() {
  const [p, q] = [...pointers.values()];
  return { dist: Math.hypot(p.x - q.x, p.y - q.y), cx: (p.x + q.x) / 2, cy: (p.y + q.y) / 2 };
}

function setCursor() {
  const h = drag ?? hover;
  canvas.style.cursor = drag?.pan
    ? "grabbing"
    : !h
      ? ""
      : h.vertex !== undefined
        ? "move"
        : drag
          ? "grabbing"
          : "grab";
}

canvas.addEventListener("pointerdown", (e) => {
  const [px, py] = local(e);
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: px, y: py });
  if (pointers.size === 2) {
    drag = null;
    pinch = pinchState();
    return;
  }
  const hit = hitTest(px, py, e.pointerType === "touch" ? 16 : 8);
  drag = hit ? { ...hit, lastX: px, lastY: py } : { shape: -1, lastX: px, lastY: py, pan: true };
  setCursor();
  schedule();
});

canvas.addEventListener("pointermove", (e) => {
  const [px, py] = local(e);
  coordsEl.textContent = `${+wx(px).toPrecision(7)}, ${+wy(py).toPrecision(7)}`;
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: px, y: py });

  if (pinch && pointers.size === 2) {
    const next = pinchState();
    view.x -= (next.cx - pinch.cx) / view.scale;
    view.y += (next.cy - pinch.cy) / view.scale;
    zoomAt(next.cx, next.cy, next.dist / pinch.dist);
    pinch = next;
    return;
  }

  if (!drag) {
    const h = hitTest(px, py, 8);
    if (JSON.stringify(h) !== JSON.stringify(hover)) {
      hover = h;
      setCursor();
      schedule();
    }
    return;
  }

  const dx = (px - drag.lastX) / view.scale,
    dy = -(py - drag.lastY) / view.scale;
  drag.lastX = px;
  drag.lastY = py;
  if (drag.pan) {
    view.x -= dx;
    view.y -= dy;
    schedule();
  } else if (drag.vertex !== undefined) {
    shapes[drag.shape][drag.poly!][drag.ring!][drag.vertex] = [wx(px), wy(py)];
    schedule(true);
  } else {
    for (const poly of shapes[drag.shape])
      for (const ring of poly)
        for (const p of ring) {
          p[0] += dx;
          p[1] += dy;
        }
    schedule(true);
  }
});

function endPointer(e: PointerEvent) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 0) {
    drag = null;
    setCursor();
    schedule();
  }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", () => {
  coordsEl.textContent = "";
  if (hover && !drag) {
    hover = null;
    schedule();
  }
});

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const [px, py] = local(e);
    zoomAt(px, py, Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)));
  },
  { passive: false },
);

canvas.addEventListener("dblclick", (e) => {
  const [px, py] = local(e);
  const vertex = hitVertex(px, py, 8);
  if (vertex) {
    const ring = shapes[vertex.shape][vertex.poly!][vertex.ring!];
    if (ring.length > 3) ring.splice(vertex.vertex!, 1);
    hover = null;
    schedule(true);
    return;
  }
  const edge = hitEdge(px, py, 6);
  if (edge) {
    shapes[edge.shape][edge.poly!][edge.ring!].splice(edge.vertex!, 0, edge.at);
    schedule(true);
  }
});

// ── Controls ─────────────────────────────────────────────────
function setOp(next: Op) {
  op = next;
  for (const b of opButtons) b.setAttribute("aria-pressed", String(b.dataset.op === op));
  resultMs = 0;
  updateHash();
  schedule(true);
}

function updateHash() {
  const hash = `#${encodeURIComponent(caseName)}/${op}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);
}

const caseNames = [DEMO, ...names];
const groups: Record<string, string> = {
  demo: "Playground",
  generic: "Generic test cases",
  fixtures: "Fixtures",
  synthetic: "Synthetic",
};
for (const [prefix, label] of Object.entries(groups)) {
  const group = document.createElement("optgroup");
  group.label = label;
  for (const name of caseNames.filter((n) => n.startsWith(prefix + "/")))
    group.append(new Option(name.slice(prefix.length + 1), name));
  select.append(group);
}
select.addEventListener("change", () => selectCase(select.value));

for (const b of opButtons) b.addEventListener("click", () => setOp(b.dataset.op as Op));

document.getElementById("fit")!.addEventListener("click", fit);
document.getElementById("swap")!.addEventListener("click", () => {
  shapes = [shapes[1], shapes[0]];
  original = [original[1], original[0]];
  schedule(true);
});
document.getElementById("reset")!.addEventListener("click", () => {
  shapes = [clone(original[0]), clone(original[1])];
  fit();
  schedule(true);
});

function copyButton(id: string, text: () => string) {
  const button = document.getElementById(id)!;
  const label = button.textContent!.trim();
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text());
      button.textContent = "copied";
    } catch {
      button.textContent = "could not copy";
    }
    button.classList.add("done");
    setTimeout(() => {
      button.textContent = label;
      button.classList.remove("done");
    }, 1500);
  });
}

const feature = (coordinates: MultiPolygon, properties = {}) => ({
  type: "Feature",
  properties,
  geometry: { type: "MultiPolygon", coordinates },
});
copyButton("copy-input", () =>
  JSON.stringify({ type: "FeatureCollection", features: shapes.map((s) => feature(geometry(s))) }),
);
copyButton("copy-result", () => JSON.stringify(feature(result)));

document.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLSelectElement || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key >= "1" && e.key <= "5") setOp(OPS[Number(e.key) - 1]);
  else if (e.key === "f" || e.key === "F") fit();
  else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const i = caseNames.indexOf(caseName);
    const n = caseNames.length;
    selectCase(caseNames[(i + (e.key === "ArrowLeft" ? -1 : 1) + n) % n]);
  }
});

document.addEventListener("paste", (e) => {
  const text = e.clipboardData?.getData("text/plain");
  if (text && loadGeoJSON(text)) e.preventDefault();
});

document.addEventListener("dragover", (e) => {
  e.preventDefault();
  document.body.classList.add("dropping");
});
document.addEventListener("dragleave", () => document.body.classList.remove("dropping"));
document.addEventListener("drop", async (e) => {
  e.preventDefault();
  document.body.classList.remove("dropping");
  const file = e.dataTransfer?.files[0];
  if (file) loadGeoJSON(await file.text());
});

new ResizeObserver(() => schedule()).observe(canvas);

// ── Start ────────────────────────────────────────────────────
const [hashCase, hashOp] = location.hash.slice(1).split("/").map(decodeURIComponent);
if (OPS.includes(hashOp as Op)) setOp(hashOp as Op);
selectCase(caseNames.includes(hashCase) ? hashCase : DEMO);
