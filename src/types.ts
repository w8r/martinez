import SweepEvent from './sweep_event';
import BinaryQueue from 'tinyqueue';

export declare type Point = [number, number];
export declare type MultiPolygon = Point[][][];
export declare type Polygon = Point[][];
export declare type Contour = Point[];
export declare type BoundingBox = [number, number, number, number];
export type Geometry = Polygon | MultiPolygon;

export type Queue = BinaryQueue<SweepEvent>;

export function isPolygon(
  geometry: Polygon | MultiPolygon
): geometry is Polygon {
  return typeof geometry[0][0][0] === 'number';
}

export type ContourId = number;
