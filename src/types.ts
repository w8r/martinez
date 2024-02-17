export type Point = [number, number];

export type BoundingBox = [number, number, number, number];

export type Polygon = Point[][];
export type MultiPolygon = Point[][][];
export type Geometry = Polygon | MultiPolygon;
