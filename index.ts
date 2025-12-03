import boolean from './src/';
import {
  INTERSECTION,
  DIFFERENCE,
  UNION,
  XOR
} from './src/operation';
import { Geometry } from './src/types';

export function union(subject: Geometry, clipping: Geometry): Geometry | null {
  return boolean(subject, clipping, UNION);
}

export function diff(subject: Geometry, clipping: Geometry): Geometry | null {
  return boolean(subject, clipping, DIFFERENCE);
}

export function xor(subject: Geometry, clipping: Geometry): Geometry | null {
  return boolean(subject, clipping, XOR);
}

export function intersection(subject: Geometry, clipping: Geometry): Geometry | null {
  return boolean(subject, clipping, INTERSECTION);
}

/**
 * @enum {Number}
 */
export const operations = { UNION, DIFFERENCE, INTERSECTION, XOR };
