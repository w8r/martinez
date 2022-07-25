import { ContourId, Point } from './types';

export default class Contour {
  public points: Point[] = [];
  public holeIds: ContourId[] = [];
  public holeOf: ContourId | null = null;
  public depth = 0;

  public isExterior() {
    return this.holeOf === null;
  }
}
