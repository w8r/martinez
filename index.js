import boolean from './src/';
import {
  INTERSECTION,
  DIFFERENCE,
  UNION,
  XOR
} from './src/operation';

export function union (subject, clipping) {
  return boolean(subject, clipping, UNION);
}

export function diff (subject, clipping) {
  return boolean(subject, clipping, DIFFERENCE);
}

export function xor (subject, clipping) {
  return boolean(subject, clipping, XOR);
}

export function intersection (subject, clipping) {
  return boolean(subject, clipping, INTERSECTION);
}

/**
 * @enum {Number}
 */
export const operations = { UNION, DIFFERENCE, INTERSECTION, XOR };
