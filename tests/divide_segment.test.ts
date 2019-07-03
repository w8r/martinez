import { describe, it } from 'mocha';
import { assert }       from 'chai';

import path              from 'path';
import fs                from 'fs';
import Queue             from 'tinyqueue';
import martinez          from '../';
import SweepEvent        from '../src/sweep_event';
import compareEvents     from '../src/compare_events';
import intersection      from '../src/intersection';
import fillQueue         from '../src/fill_queue';
import divideSegment     from '../src/divide_segment';
import subdivideSegments from '../src/subdivide_segments';
import possibleIntersection from '../src/possible_intersection';
import Tree              from 'splaytree';
import compareSegments   from '../src/compare_segments';
import { Point, BoundingBox } from '../src/types';
import { INTERSECTION } from '../src/operation';

const equals = (p1:Point, p2:Point):boolean => {
  if (p1[0] === p2[0]) {
    if (p1[1] === p2[1]) {
      return true;
    } else {
      return false;
    }
  }
  return false;
}

// GeoJSON Data
const shapes = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'two_shapes.geojson'), 'utf8'));


const subject = shapes.features[0];
const clipping = shapes.features[1];

describe('divide segments', () => {

  it('divide 2 segments', () => {
    const se1 = new SweepEvent([0, 0], true, new SweepEvent([5, 5], false, null, false), true);
    const se2 = new SweepEvent([0, 5], true, new SweepEvent([5, 0], false, null, false), false);
    const q = new Queue<SweepEvent>([], compareEvents);

    q.push(se1);
    q.push(se2);

    const a = se1.point, b = se1.otherEvent.point;
    const c = se2.point, d = se2.otherEvent.point;

    const iter:[Point, Point] = [[0, 0], [0, 0]];
    intersection(
      a[0], a[1], b[0], b[1],
      c[0], c[1], d[0], d[1],
      iter
    );


    divideSegment(se1, iter[0], q);
    divideSegment(se2, iter[0], q);

    assert.equal(q.length, 6, 'subdivided in 4 segments by intersection point');
  });

  it('possible intersections', () => {
    const s = subject.geometry.coordinates;
    const c = clipping.geometry.coordinates;

    const q = new Queue([], compareEvents);

    const se1 = new SweepEvent(s[0][3], true, new SweepEvent(s[0][2], false, null, false), true);
    const se2 = new SweepEvent(c[0][0], true, new SweepEvent(c[0][1], false, null, false), false);

    // console.log(se1.point, se1.left, se1.otherEvent.point, se1.otherEvent.left);
    // console.log(se2.point, se2.left, se2.otherEvent.point, se2.otherEvent.left);

    assert.equal(possibleIntersection(se1, se2, q), 1);
    assert.equal(q.length, 4);

    let e:SweepEvent;

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
    const s = [subject.geometry.coordinates];
    const c = [clipping.geometry.coordinates];

    const bbox:BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];
    const q = fillQueue(s, c, bbox, bbox, INTERSECTION);
    const p0:Point = [16, 282];
    const p1:Point = [298, 359];
    const p2:Point = [156, 203.5];

    const te  = new SweepEvent(p0, true, null, true);
    const te2 = new SweepEvent(p1, false, te, false);
    te.otherEvent = te2;

    const te3 = new SweepEvent(p0, true, null, true);
    const te4 = new SweepEvent(p2, true, te3, false);
    te3.otherEvent = te4;

    const tr = new Tree<SweepEvent>(compareSegments);

    assert.isDefined(tr.insert(te), 'insert');
    assert.isDefined(tr.insert(te3), 'insert');

    assert.deepEqual(tr.find(te).key, te);
    assert.deepEqual(tr.find(te3).key, te3);

    assert.equal(compareSegments(te, te3), 1);
    assert.equal(compareSegments(te3, te), -1);

    const segments = subdivideSegments(q, s, c, bbox, bbox, 0);
    const leftSegments:SweepEvent[] = [];
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].left) {
        leftSegments.push(segments[i]);
      }
    }

    assert.equal(leftSegments.length, 11);

    const E:Point = [16, 282];
    const I:Point = [100.79403384562252, 233.41363754101192];
    const G:Point = [298, 359];
    const C:Point = [153, 294.5];
    const J:Point = [203.36313843035356, 257.5101243166895];
    const F:Point = [153, 203.5];
    const D:Point = [56, 181];
    const A:Point = [108.5, 120];
    const B:Point = [241.5, 229.5];

    type Interval = {
      l: Point, r: Point,
      inOut?: boolean,
      otherInOut?: boolean,
      inResult?: boolean,
      prevInResult: Interval|null
    };

    const intervals:{ [index:string]: Interval } = {
      'EI': {
        l: E, r: I,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'IF': {
        l: I, r: F,
        inOut: false,
        otherInOut: false,
        inResult: true,
        prevInResult: null
      },
      'FJ': {
        l: F, r: J,
        inOut: false,
        otherInOut: false,
        inResult: true,
        prevInResult: null
      },
      'JG': {
        l: J, r: G,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'EG': {
        l: E, r: G,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'DA': {
        l: D, r: A,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'AB': {
        l: A, r: B,
        inOut: false,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },
      'JB': {
        l: J, r: B,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      },

      'CJ': {
        l: C, r: J,
        inOut: true,
        otherInOut: false,
        inResult: true,
        prevInResult: {
          l: F, r: J,
          prevInResult: null
        }
      },
      'IC': {
        l: I, r: C,
        inOut: true,
        otherInOut: false,
        inResult: true,
        prevInResult: {
          l: I, r: F,
          prevInResult: null
        }},

      'DI': {
        l: D, r: I,
        inOut: true,
        otherInOut: true,
        inResult: false,
        prevInResult: null
      }
    };

    function checkContain(interval:string) {
      const data = intervals[interval];
      for (let x = 0; x < leftSegments.length; x++) {
        const seg = leftSegments[x];
        assert.isTrue(equals(seg.point, data.l) &&
           equals(seg.otherEvent.point, data.r) &&
           seg.inOut      === data.inOut &&
           seg.otherInOut === data.otherInOut &&
           seg.inResult   === data.inResult &&
           ((seg.prevInResult === null && data.prevInResult === null) ||
            (equals(seg.prevInResult.point, data.prevInResult.l) &&
            equals(seg.prevInResult.otherEvent.point, data.prevInResult.r))));
      }
    }

    Object.keys(intervals).forEach((key) => checkContain(key));
  });
});
