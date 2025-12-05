export type Position = [number, number]
export type Ring = Position[]
export type Polygon = Position[][]
export type MultiPolygon = Position[][][]
export type Geometry = Polygon | MultiPolygon

export function union(subject: Geometry, clipping: Geometry): Geometry;
export function diff(subject: Geometry, clipping: Geometry): Geometry;
export function xor(subject: Geometry, clipping: Geometry): Geometry;
export function intersection(subject: Geometry, clipping: Geometry): Geometry;
