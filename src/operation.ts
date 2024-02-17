export const INTERSECTION = 0;
export const UNION = 1;
export const DIFFERENCE = 2;
export const XOR = 3;

export type OperationType =
  | typeof INTERSECTION
  | typeof UNION
  | typeof DIFFERENCE
  | typeof XOR;
