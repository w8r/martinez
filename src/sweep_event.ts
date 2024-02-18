import { EdgeType, NORMAL } from "./edge_type";
import { Point } from "./types";

export class SweepEvent {
  /** is left endpoint */
  public left: boolean;
  /** Associated countour point */
  public point: Point;
  /** Other edge reference */
  public otherEvent: SweepEvent;
  /** Belongs to source or clipping polygon */
  public isSubject: boolean;
  /** Edge contribution type */
  public type: EdgeType;
  /** In-out transition for the sweepline crossing polygon */
  public inOut: boolean;
  /** Other in-out transition for the sweepline crossing polygon */
  public otherInOut: boolean;
  /** Previous event in result? */
  public prevInResult: SweepEvent | null;
  /** Type of result transition (0 = not in result, +1 = out-in, -1, in-out) */
  public resultTransition: number;
  /** Contour ID */
  public contourId: number;
  /** for sorting */
  public otherPos: number;
  /** Output contour ID */
  public outputContourId: number;
  /** Does it belong to exterior ring */
  public isExteriorRing: boolean;
  /**
   * Sweepline event
   */
  constructor(
    point: Point,
    left: boolean,
    otherEvent: SweepEvent | undefined,
    isSubject: boolean,
    edgeType: EdgeType
  ) {
    this.left = left;
    this.point = point;
    this.otherEvent = otherEvent as SweepEvent;

    /**
     * Belongs to source or clipping polygon
     * @type {Boolean}
     */
    this.isSubject = isSubject;

    this.type = edgeType;

    this.inOut = false;
    this.otherInOut = false;
    this.prevInResult = null;
    this.resultTransition = 0;

    // connection step
    this.otherPos = -1;
    this.outputContourId = -1;

    this.isExteriorRing = true; // TODO: Looks unused, remove?
    this.contourId = -1;
  }

  isBelow(p: Point) {
    const p0 = this.point;
    const p1 = this.otherEvent.point;
    return this.left
      ? (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0
      : // signedArea(this.point, this.otherEvent.point, p) > 0 :
        (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
    //signedArea(this.otherEvent.point, this.point, p) > 0;
  }

  isAbove(p: Point) {
    return !this.isBelow(p);
  }

  isVertical() {
    return this.point[0] === this.otherEvent.point[0];
  }

  /** Does event belong to result? */
  get inResult() {
    return this.resultTransition !== 0;
  }

  clone() {
    const copy = new SweepEvent(
      this.point,
      this.left,
      this.otherEvent,
      this.isSubject,
      this.type
    );

    copy.contourId = this.contourId;
    copy.resultTransition = this.resultTransition;
    copy.prevInResult = this.prevInResult;
    copy.isExteriorRing = this.isExteriorRing;
    copy.inOut = this.inOut;
    copy.otherInOut = this.otherInOut;

    return copy;
  }
}

// version with defaults for testing
export const sweepEvent = (
  point: Point,
  left: boolean,
  otherEvent: SweepEvent | undefined = undefined,
  isSubject: boolean = true,
  edgeType: EdgeType = NORMAL
) => new SweepEvent(point, left, otherEvent, isSubject, edgeType);
