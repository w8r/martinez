import removeSpikes from "./remove_spikes";
import isDegenerateRing from "./is_degenerate_ring";
import signedArea from "./signed_area";
import { Position, Polygon, MultiPolygon } from "./types";

/**
 * Whether a closed ring runs counter-clockwise. Uses the exact orientation of
 * the corner at the lowest-leftmost vertex, which is always convex, so even
 * sliver rings whose summed area is lost in rounding get the right answer.
 */
function isCounterClockwise(ring: Position[]): boolean {
  const n = ring.length - 1; // the last point repeats the first
  let k = 0;
  for (let i = 1; i < n; i++) {
    if (ring[i][0] < ring[k][0] || (ring[i][0] === ring[k][0] && ring[i][1] < ring[k][1])) k = i;
  }
  const turn = signedArea(ring[(k + n - 1) % n], ring[k], ring[(k + 1) % n]);
  if (turn !== 0) return turn > 0;
  // Collinear corner (not a real vertex): fall back to the summed area
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return area > 0;
}

/**
 * Turns the points of an output contour into a valid closed ring: removes
 * zero-width spikes and repeated points, rejects rings that enclose no area
 * and orients the ring as GeoJSON (RFC 7946) requires: exterior rings
 * counter-clockwise, holes clockwise. This is the single place where output
 * rings are cleaned up.
 *
 * @param  {Position[]} points
 * @param  {boolean} isHole
 * @return {Position[]|null} the ring, or null if it is degenerate
 */
export default function normalizeContour(points: Position[], isHole: boolean): Position[] | null {
  const ring = removeSpikes(points);
  if (isDegenerateRing(ring)) return null;
  if (isCounterClockwise(ring) === isHole) ring.reverse();
  return ring;
}

/**
 * Applies normalizeContour to every ring of a multipolygon, leaving out
 * degenerate holes and polygons whose exterior ring is degenerate.
 *
 * @param  {MultiPolygon} multiPolygon
 * @return {MultiPolygon}
 */
export function normalizePolygons(multiPolygon: MultiPolygon): MultiPolygon {
  const result: MultiPolygon = [];
  for (const polygon of multiPolygon) {
    const exterior = normalizeContour(polygon[0], false);
    if (exterior === null) continue;
    const normalized: Polygon = [exterior];
    for (let i = 1; i < polygon.length; i++) {
      const hole = normalizeContour(polygon[i], true);
      if (hole !== null) normalized.push(hole);
    }
    result.push(normalized);
  }
  return result;
}
