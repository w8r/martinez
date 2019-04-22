import { EdgeType } from './edge_type';
import { Point } from './types';
/**
 * Sweepline event
 */
export default class SweepEvent {
    /**
     * Is left endpoint?
     */
    left: boolean;
    point: Point;
    /**
     * Edge contribution type
     */
    type: EdgeType;
    /**
     * Other edge reference
     */
    otherEvent: SweepEvent;
    /**
     * Belongs to source or clipping polygon
     */
    isSubject: boolean;
    /**
     * In-out transition for the sweepline crossing polygon
     */
    inOut: boolean;
    otherInOut: boolean;
    /**
     * Previous event in result?
     */
    prevInResult: SweepEvent;
    /**
     * Does event belong to result?
     */
    inResult: boolean;
    resultInOut: boolean;
    isExteriorRing: boolean;
    contourId: number;
    pos?: number;
    constructor(point: Point, left: boolean, otherEvent: SweepEvent | null, isSubject: boolean, edgeType?: EdgeType);
    /**
     * @param  {Array.<Number>}  p
     * @return {Boolean}
     */
    isBelow(p: Point): boolean;
    /**
     * @param  {Array.<Number>}  p
     * @return {Boolean}
     */
    isAbove(p: Point): boolean;
    /**
     * @return {Boolean}
     */
    isVertical(): boolean;
    clone(): SweepEvent;
}
