import { describe, it, assert } from 'vitest';
import path from 'path';
import Queue from 'tinyqueue';
import load from 'load-json-file';
import SweepEvent from '../src/sweep_event';
import compareEvents from '../src/compare_events';
import intersection from '../src/segment_intersection';
import equals from '../src/equals';
import fillQueue from '../src/fill_queue';
import divideSegment from '../src/divide_segment';
import subdivideSegments from '../src/subdivide_segments';
import possibleIntersection from '../src/possible_intersection';
import Tree from 'splaytree';
import compareSegments from '../src/compare_segments';
import { BoundingBox, MultiPolygon, Point } from '../src/types';

// GeoJSON Data
const shapes = load.sync(
  path.join(__dirname, 'fixtures', 'two_shapes.geojson')
);

const subject = shapes.features[0];
const clipping = shapes.features[1];

describe('divide segments', () => {
  it('divide 2 segments', () => {
    const se1 = new SweepEvent(
      [0, 0],
      true,
      new SweepEvent([5, 5], false, null, false),
      true
    );
    const se2 = new SweepEvent(
      [0, 5],
      true,
      new SweepEvent([5, 0], false, null, false),
      false
    );
    const q = new Queue(undefined, compareEvents);

    q.push(se1);
    q.push(se2);

    const iter = intersection(
      se1.point,
      se1.otherEvent.point,
      se2.point,
      se2.otherEvent.point,
      false
    );

    if (iter) {
      divideSegment(se1, iter[0] as Point, q);
      divideSegment(se2, iter[0] as Point, q);
    }

    assert.equal(q.length, 6, 'subdivided in 4 segments by intersection point');
  });

  it('possible intersections', () => {
    const s = subject.geometry.coordinates;
    const c = clipping.geometry.coordinates;

    const q = new Queue(undefined, compareEvents);

    const se1 = new SweepEvent(
      s[0][3],
      true,
      new SweepEvent(s[0][2], false, null, false),
      true
    );
    const se2 = new SweepEvent(
      c[0][0],
      true,
      new SweepEvent(c[0][1], false, null, false),
      false
    );

    // console.log(se1.point, se1.left, se1.otherEvent.point, se1.otherEvent.left);
    // console.log(se2.point, se2.left, se2.otherEvent.point, se2.otherEvent.left);

    assert.equal(possibleIntersection(se1, se2, q), 1);
    assert.equal(q.length, 4);

    let e;

    e = q.pop();
    assert.deepEqual(e.point, [100.79403384562251, 233.41363754101192]);
    assert.deepEqual(e.otherEvent.point, [56, 181], '1');

    e = q.pop();
    assert.deepEqual(e.point, [100.79403384562251, 233.41363754101192]);
    assert.deepEqual(e.otherEvent.point, [16, 282], '2');

    e = q.pop();
    assert.deepEqual(e.point, [100.79403384562251, 233.41363754101192]);
    assert.deepEqual(e.otherEvent.point, [153, 203.5], '3');

    e = q.pop();
    assert.deepEqual(e.point, [100.79403384562251, 233.41363754101192]);
    assert.deepEqual(e.otherEvent.point, [153, 294.5], '4');
  });

  it('possible intersections on 2 polygons', () => {
    const s = [subject.geometry.coordinates] as MultiPolygon;
    const c = [clipping.geometry.coordinates] as MultiPolygon;

    const bbox: BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];
    const q = fillQueue(s, c, bbox, bbox, 0);
    const p0: Point = [16, 282];
    const p1: Point = [298, 359];
    const p2: Point = [156, 203.5];

    const te = new SweepEvent(p0, true, null, true);
    const te2 = new SweepEvent(p1, false, te, false);
    te.otherEvent = te2;

    const te3 = new SweepEvent(p0, true, null, true);
    const te4 = new SweepEvent(p2, true, te3, false);
    te3.otherEvent = te4;

    const tr = new Tree(compareSegments);

    assert.ok(tr.insert(te), 'insert');
    assert.ok(tr.insert(te3), 'insert');

    assert.equal(tr.find(te).key, te);
    assert.equal(tr.find(te3).key, te3);

    assert.equal(compareSegments(te, te3), 1);
    assert.equal(compareSegments(te3, te), -1);

    const segments = subdivideSegments(q, bbox, bbox, 0);
    const leftSegments: SweepEvent[] = [];
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].left) {
        leftSegments.push(segments[i]);
      }
    }

    assert.equal(leftSegments.length, 11);

    const E = [16, 282];
    const I = [100.79403384562252, 233.41363754101192];
    const G = [298, 359];
    const C = [153, 294.5];
    const J = [203.36313843035356, 257.5101243166895];
    const F = [153, 203.5];
    const D = [56, 181];
    const A = [108.5, 120];
    const B = [241.5, 229.5];

    const intervals = {
      EI: {
        l: E,
        r: I,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      IF: {
        l: I,
        r: F,
        inOut: false,
        otherInOut: false,
        inResult: true,
        prevInResult: null
      },
      FJ: {
        l: F,
        r: J,
        inOut: false,
        otherInOut: false,
        inResult: true,
        prevInResult: null
      },
      JG: {
        l: J,
        r: G,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      EG: {
        l: E,
        r: G,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      DA: {
        l: D,
        r: A,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      AB: {
        l: A,
        r: B,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      JB: {
        l: J,
        r: B,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },

      CJ: {
        l: C,
        r: J,
        inOut: true,
        otherInOut: false,
        inResult: true,
        prevInResult: {
          l: F,
          r: J,
          prevInResult: null
        }
      },
      IC: {
        l: I,
        r: C,
        inOut: true,
        otherInOut: false,
        inResult: true,
        prevInResult: {
          l: I,
          r: F,
          prevInResult: null
        }
      },

      DI: {
        l: D,
        r: I,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      }
    };

    function checkContain(interval) {
      const data = intervals[interval];
      for (let x = 0; x < leftSegments.length; x++) {
        const seg = leftSegments[x];
        if (
          equals(seg.point, data.l) &&
          equals(seg.otherEvent.point, data.r) &&
          seg.inOut === data.inOut &&
          seg.otherInOut === data.otherInOut &&
          seg.inResult === data.inResult &&
          ((seg.prevInResult === null && data.prevInResult === null) ||
            (equals(seg.prevInResult!.point, data.prevInResult.l) &&
              equals(seg.prevInResult!.otherEvent.point, data.prevInResult.r)))
        ) {
          assert.ok(interval);
          return;
        }
      }
      assert.fail(interval);
    }

    Object.keys(intervals).forEach((key) => checkContain(key));
  });
});
