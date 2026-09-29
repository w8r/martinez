import removeSpikes from './remove_spikes';
import isDegenerateRing from './is_degenerate_ring';
import { Position } from './types';

/**
 * Turns the points of an output contour into a valid closed ring: removes
 * zero-width spikes and repeated points, and rejects rings that enclose no
 * area. This is the single place where output rings are cleaned up.
 *
 * @param  {Position[]} points
 * @return {Position[]|null} the ring, or null if it is degenerate
 */
export default function normalizeContour(points: Position[]): Position[] | null {
  const ring = removeSpikes(points);
  return isDegenerateRing(ring) ? null : ring;
}
