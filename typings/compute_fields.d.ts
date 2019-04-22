import { OperationType } from './operation';
import SweepEvent from './sweep_event';
/**
 * @param  {SweepEvent} event
 * @param  {SweepEvent} prev
 * @param  {Operation} operation
 */
export default function computeFields(event: SweepEvent, prev: SweepEvent | null, operation: OperationType): void;
