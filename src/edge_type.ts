export const NORMAL = 0;
export const NON_CONTRIBUTING = 1;
export const SAME_TRANSITION = 2;
export const DIFFERENT_TRANSITION = 3;

export type EdgeType =
  | typeof NORMAL
  | typeof NON_CONTRIBUTING
  | typeof SAME_TRANSITION
  | typeof DIFFERENT_TRANSITION;
