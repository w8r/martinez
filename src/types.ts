export type Point = [number, number];
export type Contour = Point[];
export type Polygon = Contour[];
export type MultiPolygon = Polygon[];
export type Geometry = Polygon | MultiPolygon;
export type BoundingBox = [number, number, number, number];
