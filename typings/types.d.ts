export declare type Point = [number, number];
export declare type Contour = Point[];
export declare type Polygon = Contour[];
export declare type MultiPolygon = Polygon[];
export declare type Geometry = Polygon | MultiPolygon;
export declare type BoundingBox = [number, number, number, number];
