import { describe, it } from 'mocha';
import { assert }       from 'chai';

import SweepEvent, { isBelow } from '../src/sweep_event';


describe('sweep event', () => {

  it('isBelow', () => {
    const s1 = new SweepEvent([0, 0], true, new SweepEvent([1, 1], false, null, false), true);
    const s2 = new SweepEvent([0, 1], false, new SweepEvent([0, 0], false, null, false), true);

    assert.isTrue(isBelow(s1, [0, 1]));
    assert.isTrue(isBelow(s1, [1, 2]));
    assert.isFalse(isBelow(s1, [0, 0]));
    assert.isFalse(isBelow(s1, [5, -1]));

    assert.isFalse(isBelow(s2, [0, 1]));
    assert.isFalse(isBelow(s2, [1, 2]));
    assert.isFalse(isBelow(s2, [0, 0]));
    assert.isFalse(isBelow(s2, [5, -1]));
  });


  it('isAbove', () => {
    const s1 = new SweepEvent([0, 0], true, new SweepEvent([1, 1], false, null, false), true);
    const s2 = new SweepEvent([0, 1], false, new SweepEvent([0, 0], false, null, false), true);

    assert.isTrue(isBelow(s1, [0, 1]));
    assert.isTrue(isBelow(s1, [1, 2]));
    assert.isFalse(isBelow(s1, [0, 0]));
    assert.isFalse(isBelow(s1, [5, -1]));

    assert.isFalse(isBelow(s2, [0, 1]));
    assert.isFalse(isBelow(s2, [1, 2]));
    assert.isFalse(isBelow(s2, [0, 0]));
    assert.isFalse(isBelow(s2, [5, -1]));
  });


  it('isVertical', () => {
    assert.isTrue(
      new SweepEvent([0, 0], true, new SweepEvent([0, 1], false, null, false), true).isVertical());
    assert.isFalse(
      new SweepEvent([0, 0], true, new SweepEvent([0.0001, 1], false, null, false), true).isVertical());
  });
});
