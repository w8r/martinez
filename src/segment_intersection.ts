//const EPS = 1e-9;

import { Point } from './types';

/**
 * Finds the magnitude of the cross product of two vectors (if we pretend
 * they're in three dimensions)
 */
const crossProduct = (ax: number, ay: number, bx: number, by: number) =>
  ax * by - ay * bx;

/**
 * Finds the dot product of two vectors.
 */
const dotProduct = (ax: number, ay: number, bx: number, by: number) =>
  ax * bx + ay * by;

const toPoint = (px: number, py: number, s: number, dx: number, dy: number) => [
  px + s * dx,
  py + s * dy
];

/**
 * Finds the intersection (if any) between two line segments a and b, given the
 * line segments' end points a1, a2 and b1, b2.
 *
 * This algorithm is based on Schneider and Eberly.
 * http://www.cimec.org.ar/~ncalvo/Schneider_Eberly.pdf
 * Page 244.
 *
 * @param {Array.<Number>} a1 point of first line
 * @param {Array.<Number>} a2 point of first line
 * @param {Array.<Number>} b1 point of second line
 * @param {Array.<Number>} b2 point of second line
 * @param {Boolean=}       noEndpointTouch whether to skip single touchpoints
 *                                         (meaning connected segments) as
 *                                         intersections
 * @returns {Array.<Array.<Number>>|Null} If the lines intersect, the point of
 * intersection. If they overlap, the two end points of the overlapping segment.
 * Otherwise, null.
 */
export default function (
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
  noEndpointTouch: boolean
) {
  // The algorithm expects our lines in the form P + sd, where P is a point,
  // s is on the interval [0, 1], and d is a vector.
  // We are passed two points. P can be the first point of each pair. The
  // vector, then, could be thought of as the distance (in x and y components)
  // from the first point to the second point.
  // So first, let's make our vectors:
  const vax = a2[0] - a1[0];
  const vay = a2[1] - a1[1];
  const vbx = b2[0] - b1[0];
  const vby = b2[1] - b1[1];

  // We also define a function to convert back to regular point form:

  // The rest is pretty much a straight port of the algorithm.
  const ex = b1[0] - a1[0];
  const ey = b1[1] - a1[1];
  let kross = crossProduct(vax, vay, vbx, vby);
  let sqrKross = kross * kross;
  const sqrLenA = dotProduct(vax, vay, vax, vay);
  //const sqrLenB  = dotProduct(vb, vb);

  // Check for line intersection. This works because of the properties of the
  // cross product -- specifically, two vectors are parallel if and only if the
  // cross product is the 0 vector. The full calculation involves relative error
  // to account for possible very small line segments. See Schneider & Eberly
  // for details.
  if (sqrKross > 0 /* EPS * sqrLenB * sqLenA */) {
    // If they're not parallel, then (because these are line segments) they
    // still might not actually intersect. This code checks that the
    // intersection point of the lines is actually on both line segments.
    const s = crossProduct(ex, ey, vbx, vby) / kross;
    if (s < 0 || s > 1) {
      // not on line segment a
      return null;
    }
    const t = crossProduct(ex, ey, vax, vay) / kross;
    if (t < 0 || t > 1) {
      // not on line segment b
      return null;
    }
    if (s === 0 || s === 1) {
      // on an endpoint of line segment a
      return noEndpointTouch ? null : [toPoint(a1[0], a1[1], s, vax, vay)];
    }
    if (t === 0 || t === 1) {
      // on an endpoint of line segment b
      return noEndpointTouch ? null : [toPoint(b1[0], b1[1], t, vbx, vby)];
    }
    return [toPoint(a1[0], a1[1], s, vax, vay)];
  }

  // If we've reached this point, then the lines are either parallel or the
  // same, but the segments could overlap partially or fully, or not at all.
  // So we need to find the overlap, if any. To do that, we can use e, which is
  // the (vector) difference between the two initial points. If this is parallel
  // with the line itself, then the two lines are the same line, and there will
  // be overlap.
  //const sqrLenE = dotProduct(e, e);
  kross = crossProduct(ex, ey, vax, vay);
  sqrKross = kross * kross;

  if (sqrKross > 0 /* EPS * sqLenB * sqLenE */) {
    // Lines are just parallel, not the same. No overlap.
    return null;
  }

  const sa = dotProduct(vax, vay, ex, ey) / sqrLenA;
  const sb = sa + dotProduct(vax, vay, vbx, vby) / sqrLenA;
  const smin = Math.min(sa, sb);
  const smax = Math.max(sa, sb);

  // this is, essentially, the FindIntersection acting on floats from
  // Schneider & Eberly, just inlined into this function.
  if (smin <= 1 && smax >= 0) {
    // overlap on an end point
    if (smin === 1) {
      return noEndpointTouch
        ? null
        : [toPoint(a1[0], a1[1], smin > 0 ? smin : 0, vax, vay)];
    }

    if (smax === 0) {
      return noEndpointTouch
        ? null
        : [toPoint(a1[0], a1[1], smax < 1 ? smax : 1, vax, vay)];
    }

    if (noEndpointTouch && smin === 0 && smax === 1) return null;

    // There's overlap on a segment -- two points of intersection. Return both.
    return [
      toPoint(a1[0], a1[1], smin > 0 ? smin : 0, vax, vay),
      toPoint(a1[0], a1[1], smax < 1 ? smax : 1, vax, vay)
    ];
  }

  return null;
}
