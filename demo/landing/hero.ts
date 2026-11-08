import type { MultiPolygon, Position } from "../../index";
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
} from "./shared";
import type { Op, Pt } from "./shared";

// Two shapes in scene units: A, a seven-pointed star with a hole, and B, a
// square frame. Each one is a set of rings in its own frame plus a position
// and an angle, so that B can drift and turn while the user edits it.

interface Shape {
  name: "A" | "B";
  rings: Pt[][]; // one polygon: the outer ring, then holes; not closed
  x: number;
  y: number;
  angle: number;
}

const initialShapes = (): [Shape, Shape] => [
  {
    name: "A",
    rings: [star(7, 1, 0.55), polygon(7, 0.27, Math.PI / 2).reverse()],
    x: -0.5,
    y: 0,
    angle: 0,
  },
  {
    name: "B",
    rings: [polygon(4, 0.95, Math.PI / 4), polygon(4, 0.5, Math.PI / 4).reverse()],
    x: 0.6,
    y: 0.05,
    angle: 0.3,
  },
];

// Scene extent that is kept in view
const SCENE_W = 3.9,
  SCENE_H = 2.5;

export function initHero() {
  const hero = document.getElementById("hero")!;
  const canvas = document.getElementById("hero-canvas") as HTMLCanvasElement;
  const copy = document.getElementById("hero-copy")!;
  const controls = document.getElementById("hero-controls")!;
  const readout = document.getElementById("hero-readout")!;
  const autoButton = document.getElementById("hero-auto")!;
  const opButtons = [...controls.querySelectorAll<HTMLButtonElement>("[data-op]")];

  const colors = {
    a: cssColor("--a"),
    b: cssColor("--b"),
    result: cssColor("--accent"),
    bg: cssColor("--bg"),
    grid: "rgba(255, 255, 255, 0.05)",
  };

  let shapes = initialShapes();
  let op: Op = "intersection";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let auto = !reducedMotion;
  let time = 0;
  let result: MultiPolygon = [];
  let resultMs = 0;
  let dirty = true;

  // Scene → CSS pixels
  let scale = 100,
    ox = 0,
    oy = 0;
  const sx = (x: number) => ox + x * scale;
  const sy = (y: number) => oy + y * scale;

  // Fit the scene either below the copy or, on wide screens, beside it,
  // whichever gives it more room
  function layout() {
    const heroBox = hero.getBoundingClientRect();
    const copyBox = copy.getBoundingClientRect();
    const w = heroBox.width;
    const bottom = controls.getBoundingClientRect().top - heroBox.top - 16;
    const boxes = [
      { left: 16, right: w - 16, top: copyBox.bottom - heroBox.top + 16 },
      {
        left: copyBox.right - heroBox.left + 24,
        right: w - 16,
        top: copyBox.top - heroBox.top - 8,
      },
    ];
    let best = 0;
    for (const box of boxes) {
      const k = Math.min((box.right - box.left) / SCENE_W, (bottom - box.top) / SCENE_H);
      if (k > best) {
        best = k;
        ox = (box.left + box.right) / 2;
        oy = (box.top + bottom) / 2;
      }
    }
    scale = Math.max(40, best);
    dirty = true;
  }

  // ── Geometry ──────────────────────────────────────────────
  function toWorld(s: Shape, [px, py]: Pt): Position {
    const c = Math.cos(s.angle),
      n = Math.sin(s.angle);
    return [s.x + px * c - py * n, s.y + px * n + py * c];
  }

  function toLocal(s: Shape, wx: number, wy: number): Pt {
    const c = Math.cos(-s.angle),
      n = Math.sin(-s.angle);
    const dx = wx - s.x,
      dy = wy - s.y;
    return [dx * c - dy * n, dx * n + dy * c];
  }

  const geometry = (s: Shape): MultiPolygon => [
    s.rings.map((ring) => {
      const world = ring.map((p) => toWorld(s, p));
      return [...world, world[0]];
    }),
  ];

  function contains(mp: MultiPolygon, x: number, y: number) {
    let inside = false;
    for (const poly of mp) {
      for (const ring of poly) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [xi, yi] = ring[i],
            [xj, yj] = ring[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
      }
    }
    return inside;
  }

  function compute() {
    const [a, b] = shapes.map(geometry);
    const run = timed(() => clip(op, a, b), 1);
    result = run.result;
    // Smooth the timing so that the readout does not flicker
    resultMs = resultMs ? resultMs * 0.85 + run.ms * 0.15 : run.ms;
  }

  // ── Drawing ───────────────────────────────────────────────
  let hover: Hit | null = null;
  let drag: (Hit & { lastX: number; lastY: number }) | null = null;

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    // Dot grid, one dot per quarter of a scene unit
    const step = scale / 4;
    if (step > 12) {
      ctx.fillStyle = colors.grid;
      const x0 = ox - Math.ceil(ox / step) * step,
        y0 = oy - Math.ceil(oy / step) * step;
      for (let x = x0; x < w; x += step)
        for (let y = y0; y < h; y += step) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
    }

    const geoms = shapes.map(geometry);
    const shapeColors = [colors.a, colors.b];

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
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.result;
    ctx.stroke();

    geoms.forEach((g, i) => {
      const active = (hover ?? drag)?.shape === i;
      ctx.beginPath();
      tracePath(ctx, g, sx, sy);
      ctx.lineWidth = active ? 1.75 : 1.25;
      ctx.strokeStyle = shapeColors[i] + (active ? "" : "b0");
      ctx.stroke();

      // Vertex handles
      for (let r = 0; r < shapes[i].rings.length; r++) {
        const ring = g[0][r];
        for (let v = 0; v < ring.length - 1; v++) {
          const hot =
            (drag ?? hover)?.shape === i &&
            (drag ?? hover)?.ring === r &&
            (drag ?? hover)?.vertex === v;
          ctx.beginPath();
          ctx.arc(sx(ring[v][0]), sy(ring[v][1]), hot ? 5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = hot ? shapeColors[i] : colors.bg;
          ctx.fill();
          ctx.lineWidth = 1.25;
          ctx.strokeStyle = shapeColors[i];
          ctx.stroke();
        }
      }

      // Label next to the topmost vertex
      let top = g[0][0][0];
      for (const p of g[0][0]) if (p[1] < top[1]) top = p;
      ctx.font = "600 12px ui-monospace, Menlo, monospace";
      ctx.fillStyle = shapeColors[i];
      ctx.textAlign = "center";
      ctx.fillText(shapes[i].name, sx(top[0]), sy(top[1]) - 10);
    });
  }

  let lastReadout = 0;
  function updateReadout(now: number, force = false) {
    if (!force && now - lastReadout < 250) return;
    lastReadout = now;
    const s = stats(result);
    const call = op === "diff_ba" ? "diff(B, A)" : `${OP_NAMES[op]}(A, B)`;
    const shape = s.polygons
      ? `${plural(s.polygons, "polygon")}, ${plural(s.holes, "hole")}, ${plural(s.vertices, "vertex")}`
      : "empty";
    readout.innerHTML = `<code>${call}</code> → ${shape} · ${formatMs(resultMs)}`;
  }

  // ── Interaction ───────────────────────────────────────────
  interface Hit {
    shape: number;
    ring?: number;
    vertex?: number;
  }

  function hitTest(px: number, py: number, radius: number): Hit | null {
    // B is drawn on top, so it wins
    for (let i = shapes.length - 1; i >= 0; i--) {
      const g = geometry(shapes[i]);
      for (let r = 0; r < g[0].length; r++) {
        const ring = g[0][r];
        for (let v = 0; v < ring.length - 1; v++) {
          if (Math.hypot(sx(ring[v][0]) - px, sy(ring[v][1]) - py) <= radius)
            return { shape: i, ring: r, vertex: v };
        }
      }
    }
    const wx = (px - ox) / scale,
      wy = (py - oy) / scale;
    for (let i = shapes.length - 1; i >= 0; i--)
      if (contains(geometry(shapes[i]), wx, wy)) return { shape: i };
    return null;
  }

  const local = (e: { clientX: number; clientY: number }) => {
    const box = canvas.getBoundingClientRect();
    return [e.clientX - box.left, e.clientY - box.top] as const;
  };

  function setAuto(on: boolean) {
    auto = on;
    autoButton.setAttribute("aria-pressed", String(on));
    if (on) start();
  }

  // Keep the page scrollable on touch screens, except when a touch starts on a shape
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const [px, py] = local(e.touches[0]);
      if (hitTest(px, py, 18)) e.preventDefault();
    },
    { passive: false },
  );

  canvas.addEventListener("pointerdown", (e) => {
    const [px, py] = local(e);
    const hit = hitTest(px, py, e.pointerType === "touch" ? 18 : 9);
    if (!hit) return;
    canvas.setPointerCapture(e.pointerId);
    drag = { ...hit, lastX: px, lastY: py };
    setAuto(false);
    canvas.style.cursor = hit.vertex === undefined ? "grabbing" : "move";
    dirty = true;
    start();
  });

  canvas.addEventListener("pointermove", (e) => {
    const [px, py] = local(e);
    if (!drag) {
      const h = hitTest(px, py, 9);
      if (JSON.stringify(h) !== JSON.stringify(hover)) {
        hover = h;
        canvas.style.cursor = !h ? "" : h.vertex === undefined ? "grab" : "move";
        dirty = true;
        start();
      }
      return;
    }
    const s = shapes[drag.shape];
    if (drag.vertex !== undefined) {
      s.rings[drag.ring!][drag.vertex] = toLocal(s, (px - ox) / scale, (py - oy) / scale);
    } else {
      // Keep the shape's centre on the canvas
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
      s.x = clamp(s.x + (px - drag.lastX) / scale, -ox / scale, (canvas.clientWidth - ox) / scale);
      s.y = clamp(s.y + (py - drag.lastY) / scale, -oy / scale, (canvas.clientHeight - oy) / scale);
    }
    drag.lastX = px;
    drag.lastY = py;
    dirty = true;
    start();
  });

  const endDrag = () => {
    if (!drag) return;
    drag = null;
    canvas.style.cursor = hover ? (hover.vertex === undefined ? "grab" : "move") : "";
    dirty = true;
    start();
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => {
    if (hover && !drag) {
      hover = null;
      dirty = true;
      start();
    }
  });

  for (const button of opButtons) {
    button.addEventListener("click", () => {
      op = button.dataset.op as Op;
      for (const b of opButtons) b.setAttribute("aria-pressed", String(b === button));
      resultMs = 0;
      dirty = true;
      start();
    });
  }

  autoButton.addEventListener("click", () => setAuto(!auto));
  document.getElementById("hero-reset")!.addEventListener("click", () => {
    shapes = initialShapes();
    time = 0;
    dirty = true;
    start();
  });

  // ── Loop ──────────────────────────────────────────────────
  // Runs while something changes; stops when idle or the hero is off screen
  let frame = 0,
    last = 0,
    visible = true;

  function tick(now: number) {
    frame = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;

    if (auto) {
      // Ease B towards a slow Lissajous orbit around A, so that resuming is smooth
      time += dt;
      const b = shapes[1];
      const k = 1 - Math.exp(-dt * 1.5);
      b.x += (0.05 + 0.85 * Math.cos(time * 0.29) - b.x) * k;
      b.y += (0.45 * Math.sin(time * 0.47) - b.y) * k;
      b.angle += dt * 0.25;
      dirty = true;
    }

    if (dirty) {
      dirty = false;
      compute();
      draw();
      updateReadout(now, !auto);
    }
    if ((auto || drag) && visible) start();
    else last = 0;
  }

  function start() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  }).observe(hero);

  new ResizeObserver(() => {
    layout();
    start();
  }).observe(hero);

  layout();
  compute();
  draw();
  updateReadout(0, true);
  hero.classList.add("ready");
  start();
}
