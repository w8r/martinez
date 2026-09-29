import { Position } from './types';

//const EPS = 1e-9;

/**
 * Point p + s * d, where d is the vector (dx, dy)
 *
 * @private
 */
function toPoint(px: number, py: number, s: number, dx: number, dy: number): Position {
  return [px + s * dx, py + s * dy];
}

/**
 * Finds the intersection (if any) between two line segments a and b, given the
 * line segments' end points a1, a2 and b1, b2.
 *
 * This algorithm is based on Schneider and Eberly.
 * http://www.cimec.org.ar/~ncalvo/Schneider_Eberly.pdf
 * Page 244.
 *
 * @param {Position} a1 point of first line
 * @param {Position} a2 point of first line
 * @param {Position} b1 point of second line
 * @param {Position} b2 point of second line
 * @param {boolean=} noEndpointTouch whether to skip single touchpoints
 *                                         (meaning connected segments) as
 *                                         intersections
 * @returns {Position[]|null} If the lines intersect, the point of
 * intersection. If they overlap, the two end points of the overlapping segment.
 * Otherwise, null.
 */
export default function segmentIntersection(a1: Position, a2: Position, b1: Position, b2: Position, noEndpointTouch?: boolean): Position[] | null {
  // The algorithm expects our lines in the form P + sd, where P is a point,
  // s is on the interval [0, 1], and d is a vector.
  // We are passed two points. P can be the first point of each pair. The
  // vector, then, could be thought of as the distance (in x and y components)
  // from the first point to the second point.
  // Vectors are kept as scalar pairs to avoid allocating on this hot path.
  const a1x = a1[0], a1y = a1[1], b1x = b1[0], b1y = b1[1];
  const vax = a2[0] - a1x, vay = a2[1] - a1y;
  const vbx = b2[0] - b1x, vby = b2[1] - b1y;

  // The rest is pretty much a straight port of the algorithm.
  const ex = b1x - a1x, ey = b1y - a1y;
  let kross    = vax * vby - vay * vbx;
  let sqrKross = kross * kross;

  // Check for line intersection. This works because of the properties of the
  // cross product -- specifically, two vectors are parallel if and only if the
  // cross product is the 0 vector. The full calculation involves relative error
  // to account for possible very small line segments. See Schneider & Eberly
  // for details.
  if (sqrKross > 0/* EPS * sqrLenB * sqLenA */) {
    // If they're not parallel, then (because these are line segments) they
    // still might not actually intersect. This code checks that the
    // intersection point of the lines is actually on both line segments.
    const s = (ex * vby - ey * vbx) / kross;
    if (s < 0 || s > 1) {
      // not on line segment a
      return null;
    }
    const t = (ex * vay - ey * vax) / kross;
    if (t < 0 || t > 1) {
      // not on line segment b
      return null;
    }
    if (s === 0 || s === 1) {
      // on an endpoint of line segment a
      return noEndpointTouch ? null : [toPoint(a1x, a1y, s, vax, vay)];
    }
    if (t === 0 || t === 1) {
      // on an endpoint of line segment b
      return noEndpointTouch ? null : [toPoint(b1x, b1y, t, vbx, vby)];
    }
    return [toPoint(a1x, a1y, s, vax, vay)];
  }

  // If we've reached this point, then the lines are either parallel or the
  // same, but the segments could overlap partially or fully, or not at all.
  // So we need to find the overlap, if any. To do that, we can use e, which is
  // the (vector) difference between the two initial points. If this is parallel
  // with the line itself, then the two lines are the same line, and there will
  // be overlap.
  kross = ex * vay - ey * vax;
  sqrKross = kross * kross;

  if (sqrKross > 0 /* EPS * sqLenB * sqLenE */) {
  // Lines are just parallel, not the same. No overlap.
    return null;
  }

  const sqrLenA = vax * vax + vay * vay;
  const sa = (vax * ex + vay * ey) / sqrLenA;
  const sb = sa + (vax * vbx + vay * vby) / sqrLenA;
  const smin = Math.min(sa, sb);
  const smax = Math.max(sa, sb);

  // this is, essentially, the FindIntersection acting on floats from
  // Schneider & Eberly, just inlined into this function.
  if (smin <= 1 && smax >= 0) {

    // overlap on an end point
    if (smin === 1) {
      return noEndpointTouch ? null : [toPoint(a1x, a1y, smin > 0 ? smin : 0, vax, vay)];
    }

    if (smax === 0) {
      return noEndpointTouch ? null : [toPoint(a1x, a1y, smax < 1 ? smax : 1, vax, vay)];
    }

    if (noEndpointTouch && smin === 0 && smax === 1) return null;

    // There's overlap on a segment -- two points of intersection. Return both.
    return [
      toPoint(a1x, a1y, smin > 0 ? smin : 0, vax, vay),
      toPoint(a1x, a1y, smax < 1 ? smax : 1, vax, vay)
    ];
  }

  return null;
}
