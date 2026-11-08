import type { MultiPolygon } from "../../index";
import { clip, cssColor, fitCanvas, formatMs, plural, stats, timed, tracePath } from "./shared";
import type { Op } from "./shared";

// Demo card thumbnails, computed with the library when the card scrolls into view

interface Spec {
  load: () => Promise<{ a: MultiPolygon; b: MultiPolygon }>;
  op: Op;
  /** [minX, minY, maxX, maxY] to show; the bounds of both inputs by default */
  view?: [number, number, number, number];
  /** Draw only A, as a backdrop, and the result */
  backdrop?: boolean;
  caption: (ms: number, a: MultiPolygon, b: MultiPolygon, result: MultiPolygon) => string;
}

const toMultiPolygon = (geometry: any): MultiPolygon =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

const pair = (json: any) => ({
  a: toMultiPolygon(json.features[0].geometry),
  b: toMultiPolygon(json.features[1].geometry),
});

const fixture = (name: string) => fetch(`./fixtures/${name}.geojson`).then((r) => r.json());

const shiftBy = (mp: MultiPolygon, dx: number): MultiPolygon =>
  mp.map((polygon) => polygon.map((ring) => ring.map(([x, y]) => [x + dx, y])));

const vertices = (...mps: MultiPolygon[]) => mps.reduce((n, mp) => n + stats(mp).vertices, 0);

const SPECS: Record<string, Spec> = {
  editor: {
    load: () => fixture("hole_hole").then(pair),
    op: "intersection",
    caption: (ms) => `intersection · ${formatMs(ms)}`,
  },
  cases: {
    load: () =>
      import("../../test/genericTestCases/issue155.geojson?raw").then((m) =>
        pair(JSON.parse(m.default)),
      ),
    op: "xor",
    caption: (ms) => `issue155 · xor · ${formatMs(ms)}`,
  },
  asia: {
    load: () =>
      fixture("asia").then((json) => {
        const a = toMultiPolygon(json.features[0].geometry);
        return { a, b: shiftBy(a, 0.3) };
      }),
    op: "diff",
    view: [95, -11, 141, 20],
    backdrop: true,
    caption: (ms, a, b) => `${plural(vertices(a, b), "vertex")} in · ${formatMs(ms)}`,
  },
};

function bounds(mps: MultiPolygon[]): [number, number, number, number] {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const mp of mps)
    for (const polygon of mp)
      for (const [x, y] of polygon[0]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  return [x0, y0, x1, y1];
}

function render(
  canvas: HTMLCanvasElement,
  spec: Spec,
  a: MultiPolygon,
  b: MultiPolygon,
  result: MultiPolygon,
) {
  const { ctx, w, h } = fitCanvas(canvas);
  const [x0, y0, x1, y1] = spec.view ?? bounds([a, b]);
  const pad = 0.08;
  const k = Math.min((w * (1 - 2 * pad)) / (x1 - x0), (h * (1 - 2 * pad)) / (y1 - y0));
  const cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2;
  // GeoJSON y points up
  const sx = (x: number) => w / 2 + (x - cx) * k;
  const sy = (y: number) => h / 2 - (y - cy) * k;

  const colors = { a: cssColor("--a"), b: cssColor("--b"), result: cssColor("--accent") };
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = "round";

  if (spec.backdrop) {
    ctx.beginPath();
    tracePath(ctx, a, sx, sy);
    ctx.fillStyle = "rgba(255, 255, 255, 0.13)";
    ctx.fill("evenodd");
  } else {
    for (const [mp, color] of [
      [a, colors.a],
      [b, colors.b],
    ] as const) {
      ctx.beginPath();
      tracePath(ctx, mp, sx, sy);
      ctx.fillStyle = color + "1c";
      ctx.fill("evenodd");
      ctx.lineWidth = 1;
      ctx.strokeStyle = color + "b0";
      ctx.stroke();
    }
  }

  ctx.beginPath();
  tracePath(ctx, result, sx, sy);
  ctx.fillStyle = colors.result + (spec.backdrop ? "" : "8c");
  ctx.fill("evenodd");
  if (!spec.backdrop) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors.result;
    ctx.stroke();
  }
}

async function build(thumb: HTMLElement) {
  const spec = SPECS[thumb.dataset.thumb!];
  const canvas = thumb.querySelector("canvas")!;
  const caption = thumb.querySelector("small")!;
  caption.textContent = "loading…";
  try {
    const { a, b } = await spec.load();
    // Large inputs run once; small ones are averaged over a few milliseconds
    const big = vertices(a, b) > 1000;
    if (!big) for (let i = 0; i < 50; i++) clip(spec.op, a, b); // warm up the JIT
    const { result, ms } = timed(() => clip(spec.op, a, b), big ? 0 : 5);
    caption.textContent = spec.caption(ms, a, b, result);
    render(canvas, spec, a, b, result);
    new ResizeObserver(() => render(canvas, spec, a, b, result)).observe(canvas);
  } catch (err) {
    caption.textContent = "could not load";
    console.error(err);
  }
}

export function initThumbs() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        build(entry.target as HTMLElement);
      }
    },
    { rootMargin: "200px" },
  );
  for (const thumb of document.querySelectorAll<HTMLElement>("[data-thumb]"))
    observer.observe(thumb);
}
