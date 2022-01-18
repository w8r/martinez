import { MultiPolygon } from './types';
import boolean from './boolean';
import { INTERSECTION, DIFFERENCE, UNION, XOR } from './operation';

export const union = (subject: MultiPolygon, clipping: MultiPolygon) =>
  boolean(subject, clipping, UNION);

export const diff = (subject: MultiPolygon, clipping: MultiPolygon) =>
  boolean(subject, clipping, DIFFERENCE);

export const xor = (subject: MultiPolygon, clipping: MultiPolygon) =>
  boolean(subject, clipping, XOR);

export const intersection = (subject: MultiPolygon, clipping: MultiPolygon) =>
  boolean(subject, clipping, INTERSECTION);

export const operations = { UNION, DIFFERENCE, INTERSECTION, XOR };
