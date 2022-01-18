import tap from 'tape';
import path from 'path';
import load from 'load-json-file';
import fillQueue from '../dist/fill_queue';

// GeoJSON Data
const data = load.sync(
  path.join(__dirname, 'fixtures', 'two_triangles.geojson')
);

const subject = data.features[0];
const clipping = data.features[1];

tap.test('fill event queue', (main) => {
  const s = [subject.geometry.coordinates];
  const c = [clipping.geometry.coordinates];

  const sbbox = [Infinity, Infinity, -Infinity, -Infinity];
  const cbbox = [Infinity, Infinity, -Infinity, -Infinity];
  const q = fillQueue(s, c, sbbox, cbbox);
  let currentPoint;

  main.test('bboxes', (t) => {
    t.deepEqual(sbbox, [20, -113.5, 226.5, 74], 'subject bbox');
    t.deepEqual(cbbox, [54.5, -198, 239.5, 33.5], 'clipping bbox');
    t.end();
  });

  main.test('point 0', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [20, -23.5]); /* s[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [226.5, -113.5],
      'other event'
    ); /* s[0][2] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });

  main.test('point 1', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [20, -23.5]); /* s[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [170, 74],
      'other event'
    ); /* s[0][1] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });

  main.test('point 2', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [54.5, -170.5]); /* c[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [239.5, -198],
      'other event'
    ); /* c[0][2] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });

  main.test('point 3', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [54.5, -170.5]); /* c[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [140.5, 33.5],
      'other event'
    ); /* c[0][1] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });

  main.test('point 4', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [140.5, 33.5]); /* c[0][0] */
    t.notOk(currentPoint.left, 'is right');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [54.5, -170.5],
      'other event'
    ); /* c[0][1] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });

  main.test('point 5', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [140.5, 33.5]); /* c[0][0] */
    t.ok(currentPoint.left, 'is left');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [239.5, -198],
      'other event'
    ); /* c[0][1] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });

  main.test('point 6', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [170, 74]); /* s[0][1] */
    t.notOk(currentPoint.left, 'is right');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [20, -23.5],
      'other event'
    ); /* s[0][0] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });

  main.test('point 7', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [170, 74]); /* s[0][1] */
    t.ok(currentPoint.left, 'is left');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [226.5, -113.5],
      'other event'
    ); /* s[0][3] */
    t.notOk(currentPoint.otherEvent.left, 'other event is right');

    t.end();
  });

  main.test('point 8', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [226.5, -113.5]); /* s[0][1] */
    t.notOk(currentPoint.left, 'is right');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [20, -23.5],
      'other event'
    ); /* s[0][0] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });

  main.test('point 9', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [226.5, -113.5]); /* s[0][1] */
    t.notOk(currentPoint.left, 'is right');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [170, 74],
      'other event'
    ); /* s[0][0] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });

  main.test('point 10', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [239.5, -198]); /* c[0][2] */
    t.notOk(currentPoint.left, 'is right');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [54.5, -170.5],
      'other event'
    ); /* c[0][0] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });

  main.test('point 11', (t) => {
    currentPoint = q.pop();
    t.deepEqual(currentPoint.point, [239.5, -198]); /* c[0][2] */
    t.notOk(currentPoint.left, 'is right');
    t.deepEqual(
      currentPoint.otherEvent.point,
      [140.5, 33.5],
      'other event'
    ); /* s[0][1] */
    t.ok(currentPoint.otherEvent.left, 'other event is left');

    t.end();
  });

  main.end();
});
