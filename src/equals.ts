import { Position } from './types';

export default function equals(p1: Position, p2: Position): boolean {
  if (p1[0] === p2[0]) {
    if (p1[1] === p2[1]) {
      return true;
    } else {
      return false;
    }
  }
  return false;
}

// Points within this many units in the last place of each other are
// considered the same up to floating-point noise.
const NEARLY_EQUAL_ULPS = 4;

function nearlyEqualCoords(a: number, b: number): boolean {
  return Math.abs(a - b) <= NEARLY_EQUAL_ULPS * Number.EPSILON * Math.max(Math.abs(a), Math.abs(b));
}

export function nearlyEquals(p1: Position, p2: Position): boolean {
  return nearlyEqualCoords(p1[0], p2[0]) && nearlyEqualCoords(p1[1], p2[1]);
}

// const EPSILON = 1e-9;
// const abs = Math.abs;
// TODO https://github.com/w8r/martinez/issues/6#issuecomment-262847164
// Precision problem.
//
// module.exports = function equals(p1, p2) {
//   return abs(p1[0] - p2[0]) <= EPSILON && abs(p1[1] - p2[1]) <= EPSILON;
// };
