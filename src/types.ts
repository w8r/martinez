export declare type Point = [number, number];
export declare type MultiPolygon = Point[][][];
export declare type Polygon = Point[][];
export declare type Contour = Point[];
export declare type BoundingBox = [number, number, number, number];

export function isPolygon (geometry:Polygon|MultiPolygon): geometry is Polygon {
  return typeof geometry[0][0][0] === 'number';
}

export function equals (a:Point, b:Point):boolean {
  if (a[0] === b[0]) {
    if (a[1] === b[1]) {
      return true;
    } else {
      return false;
    }
  }
  return false;
}