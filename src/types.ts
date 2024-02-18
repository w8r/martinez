import { Position } from "geojson";

export type Point = Position;

export type BoundingBox = [number, number, number, number];

export type Polygon = Point[][];
export type MultiPolygon = Point[][][];
export type Geometry = Polygon | MultiPolygon;
