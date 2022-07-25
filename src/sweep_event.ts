import { NORMAL } from './edge_type';
import { Point } from './types';

export default class SweepEvent {
  public left: boolean;
  public isSubject: boolean;
  public point: Point;
  public otherEvent: SweepEvent;
  public type: number;
  /** @internal */
  public pos?: number;

  // transition flags
  // In-out transition for the sweepline crossing polygon
  public inOut = false;
  public otherInOut = false;
  public prevInResult: SweepEvent | null = null;
  // Does event belong to result?
  //public inResult: boolean = false;

  // connection step
  public resultInOut = false;
  public isExteriorRing = true;
  public contourId = -1;
  public resultTransition = 0;
  public outputContourId = 0;
  public otherPos = 0;

  /**
   * Sweepline event
   *
   * @class {SweepEvent}
   * @param {Array.<Number>}  point
   * @param {Boolean}         left
   * @param {SweepEvent=}     otherEvent
   * @param {Boolean}         isSubject
   * @param {Number}          edgeType
   */
  constructor(
    point: Point,
    left: boolean,
    otherEvent: SweepEvent | null,
    isSubject: boolean
  ) {
    this.left = left;
    this.point = point;
    this.otherEvent = otherEvent as SweepEvent;
    this.isSubject = isSubject;
    this.type = NORMAL;
    this.inOut = false;
    this.otherInOut = false;

    /**
     * Previous event in result?
     * @type {SweepEvent}
     */
    this.prevInResult = null;

    /**
     * Type of result transition (0 = not in result, +1 = out-in, -1, in-out)
     * @type {Number}
     */
    this.resultTransition = 0;

    // connection step

    /**
     * @type {Number}
     */
    this.otherPos = -1;

    /**
     * @type {Number}
     */
    this.outputContourId = -1;

    this.isExteriorRing = true; // TODO: Looks unused, remove?
  }

  isBelow(p: Point) {
    return isBelow(this, p);
  }

  isAbove(p: Point) {
    return !isBelow(this, p);
  }

  /**
   * @return {Boolean}
   */
  isVertical() {
    return this.point[0] === this.otherEvent.point[0];
  }

  /**
   * Does event belong to result?
   * TODO: make it static
   * @return {Boolean}
   */
  get inResult() {
    return this.resultTransition !== 0;
  }

  clone(): SweepEvent {
    const copy = new SweepEvent(
      this.point,
      this.left,
      this.otherEvent,
      this.isSubject
    );

    copy.type = this.type;
    copy.resultTransition = this.resultTransition;
    //copy.inResult = this.inResult;
    copy.prevInResult = this.prevInResult;
    copy.isExteriorRing = this.isExteriorRing;
    copy.inOut = this.inOut;
    copy.otherInOut = this.otherInOut;

    return copy;
  }
}

export function isBelow(e: SweepEvent, p: Point): boolean {
  const p0 = e.point,
    p1 = e.otherEvent.point;
  return e.left
    ? (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0
    : // signedArea(this.point, this.otherEvent.point, p) > 0 :
      (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
  //signedArea(this.otherEvent.point, this.point, p) > 0;
}
