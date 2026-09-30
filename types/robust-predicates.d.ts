// robust-predicates 2.x lists a declaration file it does not ship
declare module "robust-predicates" {
  /**
   * Orientation of the triangle (a, b, c), computed exactly: negative if
   * counter-clockwise, positive if clockwise, zero if the points are collinear.
   */
  export function orient2d(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ): number;
}
