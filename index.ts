import boolean from "./src/";
import { INTERSECTION, DIFFERENCE, UNION, XOR } from "./src/operation";
import type { Geometry, MultiPolygon } from "./src/types";

export type {
  Position,
  Ring,
  Polygon,
  MultiPolygon,
  Geometry,
} from "./src/types";

export function union(subject: Geometry, clipping: Geometry): MultiPolygon | null {
  return boolean(subject, clipping, UNION);
}

export function diff(subject: Geometry, clipping: Geometry): MultiPolygon | null {
  return boolean(subject, clipping, DIFFERENCE);
}

export function xor(subject: Geometry, clipping: Geometry): MultiPolygon | null {
  return boolean(subject, clipping, XOR);
}

export function intersection(
  subject: Geometry,
  clipping: Geometry
): MultiPolygon | null {
  return boolean(subject, clipping, INTERSECTION);
}

/**
 * @enum {Number}
 */
export const operations = { UNION, DIFFERENCE, INTERSECTION, XOR };
