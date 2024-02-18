import boolean from "./boolean";
import { INTERSECTION, DIFFERENCE, UNION, XOR } from "./operation";
import { Geometry } from "./types";

export function union(subject: Geometry, clipping: Geometry) {
  return boolean(subject, clipping, UNION);
}

export function diff(subject: Geometry, clipping: Geometry) {
  return boolean(subject, clipping, DIFFERENCE);
}

export function xor(subject: Geometry, clipping: Geometry) {
  return boolean(subject, clipping, XOR);
}

export function intersection(subject: Geometry, clipping: Geometry) {
  return boolean(subject, clipping, INTERSECTION);
}

/**
 * @enum {Number}
 */
export const operations = { UNION, DIFFERENCE, INTERSECTION, XOR };
