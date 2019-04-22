import SweepEvent from './sweep_event';
import { Point } from './types';
import Queue from 'tinyqueue';
/**
 * @param  {SweepEvent} se
 * @param  {Array.<Number>} p
 * @param  {Queue} queue
 * @return {Queue}
 */
export default function divideSegment(se: SweepEvent, p: Point, queue: Queue<SweepEvent>): Queue<SweepEvent>;
