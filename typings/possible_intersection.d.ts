import SweepEvent from './sweep_event';
import Queue from 'tinyqueue';
/**
 * @param  {SweepEvent} se1
 * @param  {SweepEvent} se2
 * @param  {Queue}      queue
 * @return {Number}
 */
export default function possibleIntersection(se1: SweepEvent, se2: SweepEvent, queue: Queue<SweepEvent>): 0 | 1 | 2 | 3;
