import signedArea from "./signed_area";
import { Position } from "./types";

/**
 * Whether a ring encloses no area, i.e. all of its points are collinear
 * (this includes rings with fewer than three distinct points).
 *
 * @param  {Position[]} ring
 * @return {boolean}
 */
export default function isDegenerateRing(ring: Position[]): boolean {
  const p0 = ring[0];
  let i = 1;
  const len = ring.length;
  // find a second distinct point
  while (i < len && ring[i][0] === p0[0] && ring[i][1] === p0[1]) i++;
  if (i === len) return true;
  const p1 = ring[i];
  for (i++; i < len; i++) {
    if (signedArea(p0, p1, ring[i]) !== 0) return false;
  }
  return true;
}
