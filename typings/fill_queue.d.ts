import Queue from 'tinyqueue';
import SweepEvent from './sweep_event';
import { OperationType } from './operation';
import { MultiPolygon, BoundingBox } from './types';
export default function fillQueue(subject: MultiPolygon, clipping: MultiPolygon, sbbox: BoundingBox, cbbox: BoundingBox, operation: OperationType): Queue<SweepEvent>;
