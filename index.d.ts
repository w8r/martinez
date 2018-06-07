type Position = number[]
type Polygon = Position[][]
type MultiPolygon = Position[][][]
type Geometry = Polygon | MultiPolygon

export function union(subject: Geometry, clipping: Geometry): Geometry;
export function diff(subject: Geometry, clipping: Geometry): Geometry;
export function xor(subject: Geometry, clipping: Geometry): Geometry;
export function intersection(subject: Geometry, clipping: Geometry): Geometry;
