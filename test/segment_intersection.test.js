import tap from 'tape';
import intersection from '../dist/segment_intersection';

tap.test('intersection', (t) => {
  t.deepEqual(
    intersection([0, 0], [1, 1], [1, 0], [2, 2]),
    null,
    'null if no intersections'
  );
  t.deepEqual(
    intersection([0, 0], [1, 1], [1, 0], [10, 2]),
    null,
    'null if no intersections'
  );
  t.deepEqual(
    intersection([2, 2], [3, 3], [0, 6], [2, 4]),
    null,
    'null if no intersections'
  );

  t.deepEqual(
    intersection([0, 0], [1, 1], [1, 0], [0, 1]),
    [[0.5, 0.5]],
    '1 intersection'
  );
  t.deepEqual(
    intersection([0, 0], [1, 1], [0, 1], [0, 0]),
    [[0, 0]],
    'shared point 1'
  );
  t.deepEqual(
    intersection([0, 0], [1, 1], [0, 1], [1, 1]),
    [[1, 1]],
    'shared point 2'
  );

  t.deepEqual(
    intersection([0, 0], [1, 1], [0.5, 0.5], [1, 0]),
    [[0.5, 0.5]],
    'T-crossing'
  );

  t.deepEqual(
    intersection([0, 0], [10, 10], [1, 1], [5, 5]),
    [
      [1, 1],
      [5, 5]
    ],
    'full overlap'
  );
  t.deepEqual(
    intersection([1, 1], [10, 10], [1, 1], [5, 5]),
    [
      [1, 1],
      [5, 5]
    ],
    'shared point + overlap'
  );
  t.deepEqual(
    intersection([3, 3], [10, 10], [0, 0], [5, 5]),
    [
      [3, 3],
      [5, 5]
    ],
    'mutual overlap'
  );
  t.deepEqual(
    intersection([0, 0], [1, 1], [0, 0], [1, 1]),
    [
      [0, 0],
      [1, 1]
    ],
    'full overlap'
  );
  t.deepEqual(
    intersection([1, 1], [0, 0], [0, 0], [1, 1]),
    [
      [1, 1],
      [0, 0]
    ],
    'full overlap, orientation'
  );

  t.deepEqual(
    intersection([0, 0], [1, 1], [1, 1], [2, 2]),
    [[1, 1]],
    'collinear, shared point'
  );
  t.deepEqual(
    intersection([1, 1], [0, 0], [1, 1], [2, 2]),
    [[1, 1]],
    'collinear, shared other point'
  );
  t.deepEqual(
    intersection([0, 0], [1, 1], [2, 2], [4, 4]),
    null,
    'collinear, no overlap'
  );
  t.deepEqual(intersection([0, 0], [1, 1], [0, -1], [1, 0]), null, 'parallel');
  t.deepEqual(
    intersection([1, 1], [0, 0], [0, -1], [1, 0]),
    null,
    'parallel, orientation'
  );
  t.deepEqual(
    intersection([0, -1], [1, 0], [0, 0], [1, 1]),
    null,
    'parallel, position'
  );

  t.deepEqual(
    intersection([0, 0], [1, 1], [0, 1], [0, 0], true),
    null,
    'shared point 1, skip touches'
  );
  t.deepEqual(
    intersection([0, 0], [1, 1], [0, 1], [1, 1], true),
    null,
    'shared point 2, skip touches'
  );

  t.deepEqual(
    intersection([0, 0], [1, 1], [1, 1], [2, 2], true),
    null,
    'collinear, shared point, skip touches'
  );
  t.deepEqual(
    intersection([1, 1], [0, 0], [1, 1], [2, 2], true),
    null,
    'collinear, shared other point, skip touches'
  );

  t.deepEqual(
    intersection([0, 0], [1, 1], [0, 0], [1, 1], true),
    null,
    'full overlap, skip touches'
  );
  t.deepEqual(
    intersection([1, 1], [0, 0], [0, 0], [1, 1], true),
    null,
    'full overlap, orientation, skip touches'
  );

  t.deepEqual(
    intersection([0, 0], [1, 1], [1, 0], [0, 1], true),
    [[0.5, 0.5]],
    '1 intersection, skip touches'
  );

  t.end();
});
