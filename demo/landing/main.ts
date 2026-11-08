import { initHero } from "./hero";
import { initThumbs } from "./thumbs";

// The map editor used to live at index.html#<fixture>: forward old links
const EDITOR_MODES = new Set([
  "geo",
  "states",
  "trapezoid",
  "canada",
  "horseshoe",
  "hourglasses",
  "edge_overlap",
  "touching_boxes",
  "triangles",
  "holecut",
  "overlapping_segments",
  "overlap_loop",
  "overlap_y",
  "overlap_two",
  "disjoint_boxes",
  "polygons_edge_overlap",
  "vertical_boxes",
  "collapsed",
  "fatal1",
  "fatal2",
  "fatal3",
  "fatal4",
  "rectangles",
]);
if (EDITOR_MODES.has(location.hash.slice(1))) location.replace(`./editor.html${location.hash}`);

// Operations per second from the README (Apple M3, Node 22.17)
const LIBRARIES = ["martinez", "JSTS 2.12", "polygon-clipping", "polyclip-ts"];
const BENCHMARKS: [string, string, string[]][] = [
  ["Hole_Hole union", "20 vertices", ["68,058", "10,549", "28,687", "1,712"]],
  ["States union", "2.3k vertices", ["754", "426", "399", "40.2"]],
  ["Asia union", "28k vertices", ["46.8", "32.2", "19.2", "3.18"]],
  ["Asia vs Asia shifted: union", "28k + 28k", ["16.2", "5.29", "6.06", "0.97"]],
  ["Asia vs Asia shifted: difference", "28k + 28k", ["16.0", "5.25", "5.11", "0.72"]],
];

function renderBench() {
  const container = document.getElementById("bench")!;
  container.innerHTML = BENCHMARKS.map(([name, size, values]) => {
    const numbers = values.map((v) => Number(v.replace(/,/g, "")));
    const max = Math.max(...numbers);
    const bars = values
      .map(
        (v, i) =>
          `<div class="bar${i === 0 ? " me" : ""}"><span>${LIBRARIES[i]}</span>` +
          `<i style="width:${((numbers[i] / max) * 100).toFixed(1)}%"></i>` +
          `<b>${v}</b></div>`,
      )
      .join("");
    return `<div><h3>${name}<span>${size}</span></h3>${bars}</div>`;
  }).join("");
}

function initCopy() {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy!);
        button.textContent = "copied";
        button.classList.add("copied");
        setTimeout(() => {
          button.textContent = "copy";
          button.classList.remove("copied");
        }, 1500);
      } catch {
        button.textContent = "press ⌘C";
      }
    });
  }
}

initHero();
renderBench();
initThumbs();
initCopy();
