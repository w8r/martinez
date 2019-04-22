import { OperationType } from './operation';
import Queue from 'tinyqueue';
import SweepEvent from './sweep_event';
import { Geometry, BoundingBox } from './types';
export default function subdivide(eventQueue: Queue<SweepEvent>, subject: Geometry, clipping: Geometry, sbbox: BoundingBox, cbbox: BoundingBox, operation: OperationType): SweepEvent[];
