import { OperationType } from './operation';
import SweepEvent from './sweep_event';
/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<*>} polygons
 */
export default function connectEdges(sortedEvents: SweepEvent[], operation: OperationType): [number, number][][][];
