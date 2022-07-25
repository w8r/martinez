import { Point } from './types';

export default function equals(p1: Point, p2: Point) {
  if (p1[0] === p2[0]) {
    if (p1[1] === p2[1]) return true;
    return false;
  }
  return false;
}

// const EPSILON = 1e-9;
// const abs = Math.abs;
// TODO https://github.com/w8r/martinez/issues/6#issuecomment-262847164
// Precision problem.
//
// module.exports = function equals(p1, p2) {
//   return abs(p1[0] - p2[0]) <= EPSILON && abs(p1[1] - p2[1]) <= EPSILON;
// };
