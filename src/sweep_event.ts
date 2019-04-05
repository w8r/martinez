import { EdgeType, NORMAL } from './edge_type';
import { Point } from './types';


/**
 * Sweepline event
 */
export default class SweepEvent {

  /**
   * Is left endpoint?
   */
  public left:boolean;
  public point:Point;
  /**
   * Edge contribution type
   */
  public type:EdgeType;
  /**
   * Other edge reference
   */
  public otherEvent:SweepEvent;
  /**
   * Belongs to source or clipping polygon
   */
  public isSubject:boolean;
  /**
   * In-out transition for the sweepline crossing polygon
   */
  public inOut:boolean;
  public otherInOut:boolean;
  /**
   * Previous event in result?
   */
  public prevInResult:SweepEvent;
  /**
   * Does event belong to result?
   */
  public inResult:boolean;
  public resultInOut:boolean;
  public isExteriorRing:boolean;
  public contourId:number;
  public pos?:number;

  constructor (point:Point, left:boolean, otherEvent:SweepEvent|null, isSubject:boolean, edgeType:EdgeType = NORMAL) {
    this.left         = left;
    this.point        = point;
    this.otherEvent   = otherEvent;
    this.isSubject    = isSubject;
    this.type         = edgeType;
    this.inOut        = false;
    this.otherInOut   = false;
    this.prevInResult = null;
    this.inResult  = false;

    // connection step
    this.resultInOut = false;
    this.isExteriorRing = true;
  }


  /**
   * @param  {Array.<Number>}  p
   * @return {Boolean}
   */
  isBelow (p:Point) {
    const p0 = this.point, p1 = this.otherEvent.point;
    return this.left
      ? (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0
      // signedArea(this.point, this.otherEvent.point, p) > 0 :
      : (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
      //signedArea(this.otherEvent.point, this.point, p) > 0;
  }


  /**
   * @param  {Array.<Number>}  p
   * @return {Boolean}
   */
  isAbove (p:Point):boolean {
    return !this.isBelow(p);
  }


  /**
   * @return {Boolean}
   */
  isVertical ():boolean {
    return this.point[0] === this.otherEvent.point[0];
  }


  clone ():SweepEvent {
    const copy = new SweepEvent(
      this.point, this.left, this.otherEvent, this.isSubject, this.type);

    copy.inResult       = this.inResult;
    copy.prevInResult   = this.prevInResult;
    copy.isExteriorRing = this.isExteriorRing;
    copy.inOut          = this.inOut;
    copy.otherInOut     = this.otherInOut;

    return copy;
  }
}
