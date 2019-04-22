import { OperationType } from './operation';
import { Geometry } from './types';
export default function boolean(subjectGeometry: Geometry, clippingGeometry: Geometry, operation: OperationType): [number, number][][][];
