import { describe, it } from 'mocha';
import { assert }       from 'chai';

import Tree            from 'splaytree';
import compareSegments from '../src/compare_segments';
import compareEvents   from '../src/compare_events';
import SweepEvent, { isBelow }  from '../src/sweep_event';
import { Point } from '../src/types';

describe('compare segments', () => {

  describe('not collinear', () => {

    it('shared left point - right point first', () => {
      const tree = new Tree<SweepEvent>(compareSegments);
      const pt:Point = [0.0, 0.0];
      const se1 = new SweepEvent(pt, true, new SweepEvent([1, 1], false, null, false), true);
      const se2 = new SweepEvent(pt, true, new SweepEvent([2, 3], false, null, false), true);

      tree.insert(se1);
      tree.insert(se2);

      assert.deepEqual(tree.maxNode().key.otherEvent.point, [2, 3]);
      assert.deepEqual(tree.minNode().key.otherEvent.point, [1, 1]);
    });

    it('different left point - right point y coord to sort', () => {
      const tree = new Tree<SweepEvent>(compareSegments);
      const se1 = new SweepEvent([0, 1], true, new SweepEvent([1, 1], false, null, false), true);
      const se2 = new SweepEvent([0, 2], true, new SweepEvent([2, 3], false, null, false), true);

      tree.insert(se1);
      tree.insert(se2);

      assert.deepEqual(tree.minNode().key.otherEvent.point, [1, 1]);
      assert.deepEqual(tree.maxNode().key.otherEvent.point, [2, 3]);
    });

    it('events order in sweep line', () => {
      const se1 = new SweepEvent([0, 1],  true, new SweepEvent([2, 1], false, null, false), true);
      const se2 = new SweepEvent([-1, 0], true, new SweepEvent([2, 3], false, null, false), true);

      const se3 = new SweepEvent([0, 1], true, new SweepEvent([3, 4], false, null, false), true);
      const se4 = new SweepEvent([-1, 0], true, new SweepEvent([3, 1], false, null, false), true);

      assert.equal(compareEvents(se1, se2), 1);
      assert.isFalse(isBelow(se2, se1.point));

      assert.equal(compareSegments(se1, se2), -1, 'compare segments');
      assert.equal(compareSegments(se2, se1), 1,  'compare segments inverted');

      assert.equal(compareEvents(se3, se4), 1);
      assert.isTrue(isBelow(se4, se3.point));
    });

    it('first point is below', () => {
      const se2 = new SweepEvent([0, 1],  true, new SweepEvent([2, 1], false, null, false), true);
      const se1 = new SweepEvent([-1, 0], true, new SweepEvent([2, 3], false, null, false), true);

      assert.isFalse(isBelow(se1, se2.point));
      assert.equal(compareSegments(se1, se2), 1, 'compare segments');
    });
  });

  describe('collinear segments', () => {
    const se1 = new SweepEvent([1, 1], true, new SweepEvent([5, 1], false, null, false), true);
    const se2 = new SweepEvent([2, 1], true, new SweepEvent([3, 1], false, null, false), false);

    assert.notEqual(se1.isSubject, se2.isSubject);
    assert.equal(compareSegments(se1, se2), -1);
  });

  it('collinear shared left point', () => {
    const pt:Point = [0, 1];

    const se1 = new SweepEvent(pt, true, new SweepEvent([5, 1], false, null, false), false);
    const se2 = new SweepEvent(pt, true, new SweepEvent([3, 1], false, null, false), false);

    se1.contourId = 1;
    se2.contourId = 2;

    assert.equal(se1.isSubject, se2.isSubject);
    assert.equal(se1.point, se2.point);

    assert.equal(compareSegments(se1, se2), -1);

    se1.contourId = 2;
    se2.contourId = 1;

    assert.equal(compareSegments(se1, se2), +1);
  });


  it('collinear same polygon different left points', () => {
    const se1 = new SweepEvent([1, 1], true, new SweepEvent([5, 1], false, null, false), true);
    const se2 = new SweepEvent([2, 1], true, new SweepEvent([3, 1], false, null, false), true);

    assert.equal(se1.isSubject, se2.isSubject);
    assert.notEqual(se1.point, se2.point);
    assert.equal(compareSegments(se1, se2), -1);
    assert.equal(compareSegments(se2, se1), 1);
  });
});
