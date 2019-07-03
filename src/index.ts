import boolean from './boolean';
import {
  INTERSECTION,
  DIFFERENCE,
  UNION,
  XOR
} from './operation';
import { MultiPolygon } from './types';

export function union (subject:MultiPolygon, clipping:MultiPolygon) {
  return boolean(subject, clipping, UNION);
}

export function diff (subject:MultiPolygon, clipping:MultiPolygon) {
  return boolean(subject, clipping, DIFFERENCE);
}

export function xor (subject:MultiPolygon, clipping:MultiPolygon){
  return boolean(subject, clipping, XOR);
}

export function intersection (subject:MultiPolygon, clipping:MultiPolygon) {
  return boolean(subject, clipping, INTERSECTION);
}

export const operations = { UNION, DIFFERENCE, INTERSECTION, XOR };
