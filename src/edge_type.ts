export const NORMAL               = 0 as const;
export const NON_CONTRIBUTING     = 1 as const;
export const SAME_TRANSITION      = 2 as const;
export const DIFFERENT_TRANSITION = 3 as const;

export type EdgeType = typeof NORMAL | typeof NON_CONTRIBUTING | typeof SAME_TRANSITION | typeof DIFFERENT_TRANSITION;
