import { expect, test } from 'vitest';
import intersection from '../src/segment_intersection';

test('intersection', (t) => {
  expect(
    intersection([0, 0], [1, 1], [1, 0], [2, 2], false),
    'null if no intersections'
  ).toBeNull();

  expect(
    intersection([0, 0], [1, 1], [1, 0], [10, 2], false),
    'null if no intersections'
  ).toBeNull();

  expect(
    intersection([2, 2], [3, 3], [0, 6], [2, 4], false),
    'null if no intersections'
  ).toBeNull();

  expect(
    intersection([0, 0], [1, 1], [1, 0], [0, 1], false),
    '1 intersection'
  ).toStrictEqual([[0.5, 0.5]]);

  expect(
    intersection([0, 0], [1, 1], [0, 1], [0, 0], false),
    'shared point 1'
  ).toStrictEqual([[0, 0]]);

  expect(
    intersection([0, 0], [1, 1], [0, 1], [1, 1], false),
    'shared point 2'
  ).toStrictEqual([[1, 1]]);

  expect(
    intersection([0, 0], [1, 1], [0.5, 0.5], [1, 0], false),
    'T-crossing'
  ).toStrictEqual([[0.5, 0.5]]);

  expect(
    intersection([0, 0], [10, 10], [1, 1], [5, 5], false),
    'full overlap'
  ).toStrictEqual([
    [1, 1],
    [5, 5]
  ]);

  expect(
    intersection([1, 1], [10, 10], [1, 1], [5, 5], false),
    'shared point + overlap'
  ).toStrictEqual([
    [1, 1],
    [5, 5]
  ]);

  expect(
    intersection([3, 3], [10, 10], [0, 0], [5, 5], false),
    'mutual overlap'
  ).toStrictEqual([
    [3, 3],
    [5, 5]
  ]);

  expect(
    intersection([0, 0], [1, 1], [0, 0], [1, 1], false),
    'full overlap'
  ).toStrictEqual([
    [0, 0],
    [1, 1]
  ]);

  expect(
    intersection([1, 1], [0, 0], [0, 0], [1, 1], false),
    'full overlap, orientation'
  ).toStrictEqual([
    [1, 1],
    [0, 0]
  ]);

  expect(
    intersection([0, 0], [1, 1], [1, 1], [2, 2], false),
    'collinear, shared point'
  ).toStrictEqual([[1, 1]]);

  expect(
    intersection([1, 1], [0, 0], [1, 1], [2, 2], false),

    'collinear, shared other point'
  ).toStrictEqual([[1, 1]]);
  expect(
    intersection([0, 0], [1, 1], [2, 2], [4, 4], false),
    'collinear, no overlap'
  ).toBeNull();

  expect(
    intersection([0, 0], [1, 1], [0, -1], [1, 0], false),
    'parallel'
  ).toBeNull();

  expect(
    intersection([1, 1], [0, 0], [0, -1], [1, 0], false),
    'parallel, orientation'
  ).toBeNull();

  expect(
    intersection([0, -1], [1, 0], [0, 0], [1, 1], false),
    'parallel, position'
  ).toBeNull();

  expect(
    intersection([0, 0], [1, 1], [0, 1], [0, 0], true),
    'shared point 1, skip touches'
  ).toBeNull();

  expect(
    intersection([0, 0], [1, 1], [0, 1], [1, 1], true),
    'shared point 2, skip touches'
  ).toBeNull();

  expect(
    intersection([0, 0], [1, 1], [1, 1], [2, 2], true),
    'collinear, shared point, skip touches'
  ).toBeNull();

  expect(
    intersection([1, 1], [0, 0], [1, 1], [2, 2], true),
    'collinear, shared other point, skip touches'
  ).toBeNull();

  expect(
    intersection([0, 0], [1, 1], [0, 0], [1, 1], true),
    'full overlap, skip touches'
  ).toBeNull();

  expect(
    intersection([1, 1], [0, 0], [0, 0], [1, 1], true),
    'full overlap, orientation, skip touches'
  ).toBeNull();

  expect(
    intersection([0, 0], [1, 1], [1, 0], [0, 1], true),
    '1 intersection, skip touches'
  ).toStrictEqual([[0.5, 0.5]]);
});
