import { Point } from './types';
/**
 * Signed area of the triangle (p0, p1, p2)
 */
export default function signedArea(p0:Point, p1:Point, p2:Point):number {
  return (p0[0] - p2[0]) * (p1[1] - p2[1]) - (p1[0] - p2[0]) * (p0[1] - p2[1]);
}
