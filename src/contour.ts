import { Point } from "./types";

export const NONE = -1;

export class Contour {
  public points: Point[];
  public holeIds: number[];
  public holeOf: number;
  public depth: number;

  /**
   * Contour
   *
   * @class {Contour}
   */
  constructor() {
    this.points = [];
    this.holeIds = [];
    this.holeOf = NONE;
    this.depth = NONE;
  }

  isExterior() {
    return this.holeOf == NONE;
  }
}
