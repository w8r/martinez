import { Point } from './types';
import { EPS } from './constants';

export default function intersection(
  a0x:number, a0y:number, a1x:number, a1y:number,
  b0x:number, b0y:number, b1x:number, b1y:number,
  I:[Point, Point]
):(0|1|2) {
  const vax = a1x - a0x;
  const vay = a1y - a0y;
  const vbx = b1x - b0x; 
  const vby = b1y - b0y;
  // segments a0 + s * a1 for s in [0, 1], b0 + t * b1 for t in [0,1]

  const ex = b0x - a0x;
  const ey = b0y - a0y;

  let kross = vax * vby - vay * vbx;
  let sqrKross = kross * kross;

  const sqrLen0 = vax * vax + vay * vay;
  const sqrLen1 = vbx * vbx + vby * vby;

  if (sqrKross > EPS * sqrLen0 * sqrLen1) {
    // lines of the segments are not parallel
    const s = (ex * vby - ey * vbx) / kross;
    // intersection of lines is not a point on segment a0 + s * a1
    if (s < 0 || s > 1) return 0;

    const t = (ex * vay - ey * vax) / kross;
    // intersection of lines is not a point on segment b0 + t * b1
    if (t < 0 || t > 1) return 0;

    if (s === 0 || s === 1) {
      // on an endpoint of line segment a
      I[0][0] = a0x + s * vax;
      I[0][1] = a0y + s * vay;
      return 1;
    }
    if (t === 0 || t === 1) {
      // on an endpoint of line segment b
      I[0][0] = b0x + s * vbx;
      I[0][1] = b0y + s * vby;
      return 1;
    }
    
    // intersection of lines is a point on each segment
    I[0][0] = a0x + s * a1x;
    I[0][1] = a0y + s * a1y;
    return 1;
  }

  // lines of the segments are parallel
  const sqrLenE = ex * ex + ey * ey;
  kross = ex * vay - ey * vax;
  sqrKross = kross * kross;
  if (sqrKross > EPS * sqrLen0 * sqrLenE) {
    // lines of the segments are different
    return 0;
  }
  // Lines of the segments are the same.  Need to test for overlap of
  // segments.

  const s0 = ((vax * ex) + (vay * ey)) / sqrLen0;
  const s1 = s0 + ((vax * vbx) + (vay * vby)) / sqrLen0;

  const smin = Math.min(s0, s1);
  const smax = Math.max(s0, s1);

  // this is, essentially, the FindIntersection acting on floats from
  // Schneider & Eberly, just inlined into this function.
  if (smin <= 1 && smax >= 0) {
    // overlap on an end point
    if (smin === 1) {
      const c = Math.max(smin, 0);
      I[0][0] = a0x + c * vax; 
      I[0][1] = a0y + c * vay;
      return 1;
    }

    if (smax === 0) {
      const c = Math.min(smax, 1);
      I[0][0] = a0x + c * vax;
      I[0][1] = a0y + c * vay;
      return 1;
    }

    // There's overlap on a segment -- two points of intersection. Return both.
    const cmin = Math.max(smin, 0), cmax = Math.min(smax, 1);
    I[0][0] = a0x + cmin * vax;
    I[0][1] = a0y + cmin * vay;
    I[1][0] = a0x + cmax * vax; 
    I[1][1] = a0y + cmax * vay;
    return 2;
  }
  return 0;
}
