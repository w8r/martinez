import equals from "./equals";
import { Position } from "./types";

/**
 * Removes zero-width spikes (A -> B -> A) and repeated consecutive points
 * from a ring. They enclose no area but make the ring invalid; they come
 * from overlapping edges in the input. Returns a closed ring.
 *
 * @param  {Position[]} ring
 * @return {Position[]}
 */
export default function removeSpikes(ring: Position[]): Position[] {
  let len = ring.length;
  if (len > 1 && equals(ring[0], ring[len - 1])) len--;

  const out: Position[] = [];
  for (let i = 0; i < len; i++) {
    const p = ring[i];
    let n = out.length;
    if (n > 0 && equals(out[n - 1], p)) continue;
    out.push(p);
    // A -> B -> A: drop B and the repeated A
    while ((n = out.length) >= 3 && equals(out[n - 3], out[n - 1])) {
      out.length = n - 2;
    }
  }

  // The ring is cyclic: also remove spikes and repeats across its start
  let start = 0;
  let end = out.length;
  while (end - start >= 3) {
    if (equals(out[end - 1], out[start])) {
      end--; // repeated point
    } else if (equals(out[end - 2], out[start])) {
      end -= 2; // spike at out[end - 1]
    } else if (equals(out[end - 1], out[start + 1])) {
      start++; // spike at out[start]
      end--;
    } else {
      break;
    }
  }

  const result = out.slice(start, end);
  if (result.length > 0) result.push(result[0]);
  return result;
}
