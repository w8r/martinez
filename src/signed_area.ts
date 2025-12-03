import {orient2d} from 'robust-predicates';
import { Position } from './types';

/**
 * Signed area of the triangle (p0, p1, p2)
 * @param  {Position} p0
 * @param  {Position} p1
 * @param  {Position} p2
 * @return {number}
 */
export default function signedArea(p0: Position, p1: Position, p2: Position): number {
  const res = orient2d(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]);
  if (res > 0) return -1;
  if (res < 0) return 1;
  return 0;
}
