type Position = number[]
type Polygon = Position[][]
type MultiPolygon = Position[][][]
type Geometry = Polygon | MultiPolygon

export default function martinez_polygon_clipping(subject: Geometry, clipping: Geometry, operation: number): Geometry;
export function union(subject: Geometry, clipping: Geometry): Geometry;
export function diff(subject: Geometry, clipping: Geometry): Geometry;
export function xor(subject: Geometry, clipping: Geometry): Geometry;
export function intersection(subject: Geometry, clipping: Geometry): Geometry;
