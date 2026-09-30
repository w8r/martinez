import { describe, it, expectTypeOf } from 'vitest';
import { union, intersection, diff, xor, operations } from '../index';
import type { Position, Ring, Polygon, MultiPolygon, Geometry } from '../index';

// Type-level tests of the public API: checked by `tsc`, never executed.

const polygon: Polygon = [[[0, 0], [1, 0], [1, 1], [0, 0]]];
const multiPolygon: MultiPolygon = [polygon, [[[2, 2], [3, 2], [3, 3], [2, 2]]]];

describe('geometry types', () => {
  it('builds geometries out of [x, y] positions', () => {
    expectTypeOf<Position>().toEqualTypeOf<[number, number]>();
    expectTypeOf<Ring>().toEqualTypeOf<Position[]>();
    expectTypeOf<Polygon>().toEqualTypeOf<Ring[]>();
    expectTypeOf<MultiPolygon>().toEqualTypeOf<Polygon[]>();
    expectTypeOf<Geometry>().toEqualTypeOf<Polygon | MultiPolygon>();
  });

  it('only accepts two-dimensional positions', () => {
    // @ts-expect-error a position has exactly two coordinates
    const withZ: Position = [0, 0, 0];
    // @ts-expect-error a position has exactly two coordinates
    const single: Position = [0];
    void withZ;
    void single;
  });
});

describe('operations', () => {
  it('have the same signature', () => {
    for (const operation of [union, intersection, diff, xor]) {
      expectTypeOf(operation).parameters.toEqualTypeOf<[Geometry, Geometry]>();
      expectTypeOf(operation).returns.toEqualTypeOf<Geometry | null>();
    }
  });

  it('accept polygons and multipolygons in any combination', () => {
    expectTypeOf(union).toBeCallableWith(polygon, polygon);
    expectTypeOf(union).toBeCallableWith(polygon, multiPolygon);
    expectTypeOf(intersection).toBeCallableWith(multiPolygon, polygon);
    expectTypeOf(diff).toBeCallableWith(multiPolygon, multiPolygon);
  });

  it('reject a bare ring or position', () => {
    const ring: Ring = polygon[0];
    // @ts-expect-error a ring is not a polygon: wrap it in an array
    union(ring, polygon);
    // @ts-expect-error a position is not a polygon
    xor(polygon, [0, 0]);
  });

  it('accept literal coordinates without annotations', () => {
    expectTypeOf(union).toBeCallableWith(
      [[[0, 0], [1, 0], [1, 1], [0, 0]]],
      [[[[0, 0], [1, 0], [1, 1], [0, 0]]]]
    );
  });

  it('expose the operation codes', () => {
    expectTypeOf(operations).toEqualTypeOf<{
      UNION: number;
      DIFFERENCE: number;
      INTERSECTION: number;
      XOR: number;
    }>();
  });
});
