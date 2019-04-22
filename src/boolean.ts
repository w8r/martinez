import { MultiPolygon } from './types';
import Operation from './operation';
import { EMPTY } from './constants';

export default function (
  subject:MultiPolygon, 
  clipping:MultiPolygon, 
  operation: Operation
) {
  // 0. trivial cases
  // 1. subdivide
  // 2. mark
  // 3. connect
}