import { Position } from './types';

export default class Contour {
  public points: Position[];
  public holeIds: number[];
  // Index of the exterior contour this contour is a hole of
  public holeOf: number | null;
  public depth: number;

  /**
   * Contour
   *
   * @class {Contour}
   */
  constructor() {
    this.points = [];
    this.holeIds = [];
    this.holeOf = null;
    this.depth = 0;
  }

  isExterior(): boolean {
    return this.holeOf == null;
  }

}
