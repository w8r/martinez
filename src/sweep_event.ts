import { Point } from './types';
import { NORMAL } from './edge_type';

export default class SweepEvent {
  public left:boolean;
  public isSubject:boolean;
  public point:Point;
  public otherEvent:SweepEvent;
  public type:number;
  /** @internal */
  public pos?:number;

  // transition flags
  public inOut:boolean = false;
  public otherInOut:boolean = false;
  public prevInResult:SweepEvent|null = null;
  // Does event belong to result?
  public inResult:boolean = false;

  // connection step
  public resultInOut:boolean = false;
  public isExteriorRing:boolean = true;
  public contourId:number = -1;

  constructor (
    point:Point, 
    left:boolean, 
    otherEvent:SweepEvent|null, 
    isSubject:boolean, 
    edgeType:number = NORMAL
  ) {
    // Is left endpoint?
    this.left = left;
    this.point = point;

    // Other edge reference
    this.otherEvent = otherEvent;
    // Belongs to source or clipping polygon
    this.isSubject = isSubject;

    // Edge contribution type
    this.type = edgeType;
  }


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

export function isBelow(e:SweepEvent, p:Point):boolean {
  const p0 = e.point, p1 = e.otherEvent.point;
  return e.left
    ? (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0
    // signedArea(this.point, this.otherEvent.point, p) > 0 :
    : (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
    //signedArea(this.otherEvent.point, this.point, p) > 0;
}