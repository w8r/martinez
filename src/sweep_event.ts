import { NORMAL, EdgeType } from './edge_type';
import type { Node } from 'splaytree';
import { Position } from './types';


export default class SweepEvent {
  // Property declarations
  left: boolean;
  point: Position;
  otherEvent?: SweepEvent;
  isSubject: boolean;
  type: EdgeType;
  inOut: boolean;
  otherInOut: boolean;
  prevInResult: SweepEvent | null;
  resultTransition: number;
  otherPos: number;
  outputContourId: number;
  isExteriorRing: boolean;
  contourId?: number;
  // Sweep line node of a left event while its segment is in the sweep line
  node: Node<SweepEvent, unknown> | null;

  /**
   * Sweepline event
   *
   * @class {SweepEvent}
   * @param {Position}        point
   * @param {boolean}         left
   * @param {SweepEvent=}     otherEvent
   * @param {boolean}         isSubject
   * @param {EdgeType}        edgeType
   */
  constructor (point: Position, left: boolean, otherEvent?: SweepEvent, isSubject?: boolean, edgeType?: EdgeType) {
    this.left = left;
    this.point = point;
    this.otherEvent = otherEvent;
    this.isSubject = isSubject ?? false;
    this.type = edgeType || NORMAL;
    this.inOut = false;
    this.otherInOut = false;
    this.prevInResult = null;
    this.resultTransition = 0;
    this.otherPos = -1;
    this.outputContourId = -1;
    this.isExteriorRing = true;
    this.node = null;
  }


  /**
   * @param  {Position}  p
   * @return {boolean}
   */
  isBelow (p: Position): boolean {
    const p0 = this.point, p1 = this.otherEvent!.point;
    // Inlined signed area of (p0, p1, p) for left events, (p1, p0, p) otherwise
    return this.left
      ? (p0[0] - p[0]) * (p1[1] - p[1]) - (p1[0] - p[0]) * (p0[1] - p[1]) > 0
      : (p1[0] - p[0]) * (p0[1] - p[1]) - (p0[0] - p[0]) * (p1[1] - p[1]) > 0;
  }


  /**
   * @param  {Position}  p
   * @return {boolean}
   */
  isAbove (p: Position): boolean {
    return !this.isBelow(p);
  }


  /**
   * @return {boolean}
   */
  isVertical (): boolean {
    return this.point[0] === this.otherEvent!.point[0];
  }


  /**
   * Does event belong to result?
   * @return {boolean}
   */
  get inResult(): boolean {
    return this.resultTransition !== 0;
  }


  clone (): SweepEvent {
    const copy = new SweepEvent(
      this.point, this.left, this.otherEvent, this.isSubject, this.type);

    copy.contourId        = this.contourId;
    copy.resultTransition = this.resultTransition;
    copy.prevInResult     = this.prevInResult;
    copy.isExteriorRing   = this.isExteriorRing;
    copy.inOut            = this.inOut;
    copy.otherInOut       = this.otherInOut;

    return copy;
  }
}
