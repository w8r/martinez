export type Position = [number, number];
export type Ring = Position[];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];
export type Geometry = Polygon | MultiPolygon;

export type BBox = [number, number, number, number]; // [minX, minY, maxX, maxY]