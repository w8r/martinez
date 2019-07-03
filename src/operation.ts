export const INTERSECTION = 0;
export const UNION = 1;
export const DIFFERENCE = 2;
export const XOR = 3;

enum Operation {
  INTERSECTION,
  UNION,
  DIFFERENCE,
  XOR,
};

export declare type OperationType = 0 | 1 | 2 | 3;

export default Operation;