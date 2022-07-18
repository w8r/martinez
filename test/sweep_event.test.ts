import { describe, it, assert } from 'vitest';
import SweepEvent from '../src/sweep_event';

describe('sweep event', () => {
  it('isBelow', () => {
    const s1 = new SweepEvent(
      [0, 0],
      true,
      new SweepEvent([1, 1], false, null, false),
      false
    );
    const s2 = new SweepEvent(
      [0, 1],
      false,
      new SweepEvent([0, 0], false, null, false),
      false
    );

    assert.ok(s1.isBelow([0, 1]));
    assert.ok(s1.isBelow([1, 2]));
    assert.notOk(s1.isBelow([0, 0]));
    assert.notOk(s1.isBelow([5, -1]));

    assert.notOk(s2.isBelow([0, 1]));
    assert.notOk(s2.isBelow([1, 2]));
    assert.notOk(s2.isBelow([0, 0]));
    assert.notOk(s2.isBelow([5, -1]));
  });

  it('isAbove', () => {
    const s1 = new SweepEvent(
      [0, 0],
      true,
      new SweepEvent([1, 1], false, null, false),
      false
    );
    const s2 = new SweepEvent(
      [0, 1],
      false,
      new SweepEvent([0, 0], false, null, false),
      false
    );

    assert.notOk(s1.isAbove([0, 1]));
    assert.notOk(s1.isAbove([1, 2]));
    assert.ok(s1.isAbove([0, 0]));
    assert.ok(s1.isAbove([5, -1]));

    assert.ok(s2.isAbove([0, 1]));
    assert.ok(s2.isAbove([1, 2]));
    assert.ok(s2.isAbove([0, 0]));
    assert.ok(s2.isAbove([5, -1]));
  });

  it('isVertical', () => {
    assert.ok(
      new SweepEvent(
        [0, 0],
        true,
        new SweepEvent([0, 1], false, null, false),
        false
      ).isVertical()
    );
    assert.notOk(
      new SweepEvent(
        [0, 0],
        true,
        new SweepEvent([0.0001, 1], false, null, false),
        false
      ).isVertical()
    );
  });
});
