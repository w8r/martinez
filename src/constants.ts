import { MultiPolygon } from './types';

export const PRECISION = 12;
export const EMPTY: MultiPolygon = [];
export const EPS: number = Math.pow(10, -PRECISION);
export const E_LIMIT: number = Math.pow(10, PRECISION);
