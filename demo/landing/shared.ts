import * as martinez from "../../index";
import type { MultiPolygon } from "../../index";

export type Pt = [number, number];

export type Op = "union" | "intersection" | "diff" | "diff_ba" | "xor";

export const OP_NAMES: Record<Op, string> = {
  union: "union",
  intersection: "intersection",
  diff: "diff",
  diff_ba: "diff",
  xor: "xor",
};

export function clip(op: Op, a: MultiPolygon, b: MultiPolygon): MultiPolygon {
  if (op === "diff_ba") return martinez.diff(b, a);
  return martinez[op](a, b);
}

/** Runs `fn` repeatedly for about `budget` ms; returns its result and the mean time of one run */
export function timed<T>(fn: () => T, budget = 1, maxRuns = 200): { result: T; ms: number } {
  const t0 = performance.now();
  let result = fn();
  let runs = 1;
  let elapsed = performance.now() - t0;
  while (elapsed < budget && runs < maxRuns) {
    result = fn();
    runs++;
    elapsed = performance.now() - t0;
  }
  return { result, ms: elapsed / runs };
}

export const formatMs = (ms: number) =>
  ms < 1
    ? `${Math.max(1, Math.round(ms * 1000))} µs`
    : `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;

export function stats(mp: MultiPolygon) {
  let holes = 0,
    vertices = 0;
  for (const polygon of mp) {
    holes += polygon.length - 1;
    // Rings are closed: the last point repeats the first
    for (const ring of polygon) vertices += ring.length - 1;
  }
  return { polygons: mp.length, holes, vertices };
}

const PLURALS: Record<string, string> = { vertex: "vertices" };

export const plural = (n: number, word: string) =>
  `${n.toLocaleString("en-US")} ${n === 1 ? word : (PLURALS[word] ?? word + "s")}`;

/** Adds every ring of `mp` to the current path, mapped through `x`/`y` */
export function tracePath(
  ctx: CanvasRenderingContext2D,
  mp: MultiPolygon,
  x: (px: number) => number,
  y: (py: number) => number,
) {
  for (const polygon of mp) {
    for (const ring of polygon) {
      ctx.moveTo(x(ring[0][0]), y(ring[0][1]));
      for (let i = 1; i < ring.length; i++) ctx.lineTo(x(ring[i][0]), y(ring[i][1]));
      ctx.closePath();
    }
  }
}

/** Sizes a canvas backing store to its CSS box; returns the CSS size */
export function fitCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export function cssColor(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Shape builders: a regular polygon and a star, centred on the origin
export const polygon = (n: number, r: number, phase = 0): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const t = phase + (i / n) * Math.PI * 2;
    return [r * Math.cos(t), r * Math.sin(t)];
  });

export const star = (points: number, outer: number, inner: number): Pt[] =>
  Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const t = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
    return [r * Math.cos(t), r * Math.sin(t)];
  });
