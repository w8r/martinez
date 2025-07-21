export type Position = [number, number];
export type Ring = Position[];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];
export type Geometry = Polygon | MultiPolygon;

export interface BBox {
  0: number; // minX
  1: number; // minY
  2: number; // maxX
  3: number; // maxY
}