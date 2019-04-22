import { describe, it } from 'mocha';
import { assert }       from 'chai';

import Queue           from 'tinyqueue';
console.log(Queue);
import sweepEventsComp from '../src/compare_events';
import SweepEvent      from '../src/sweep_event';
import { Point }       from '../src/types';
import { NORMAL }      from '../src/edge_type';

describe('compare events', () => {

  describe('in queue', () => {

    it('queue should process lest(by x) sweep event first', () => {
      const queue = new Queue<{point:Point}>(null, sweepEventsComp);
      const e1 = {point: <Point>[0.0, 0.0]};
      const e2 = {point: <Point>[0.5, 0.5]};

      queue.push(e1);
      queue.push(e2);

      assert.strictEqual(e1, queue.pop());
      assert.strictEqual(e2, queue.pop());
    });

    it('queue should process lest(by y) sweep event first', () => {
      const queue = new Queue<{point:Point}>(null, sweepEventsComp);
      const e1 = {point: <Point>[0.0, 0.0]};
      const e2 = {point: <Point>[0.0, 0.5]};

      queue.push(e1);
      queue.push(e2);

      assert.strictEqual(e1, queue.pop());
      assert.strictEqual(e2, queue.pop());
    });


    it('queue should pop least(by left prop) sweep event first', () => {
      const queue = new Queue<{point:Point, left:boolean}>(null, sweepEventsComp);
      const e1 = {point: <Point>[0.0, 0.0], left: true};
      const e2 = {point: <Point>[0.0, 0.0], left: false};

      queue.push(e1);
      queue.push(e2);

      assert.strictEqual(e2, queue.pop());
      assert.strictEqual(e1, queue.pop());
    });
  });

  describe ('isolated', () => {
    it('sweep event comparison x coordinates', () => {
      const e1 = new SweepEvent([0.0, 0.0], true, null, false, NORMAL);
      const e2 = new SweepEvent([0.5, 0.5], true, null, false, NORMAL);

      assert.strictEqual(sweepEventsComp(e1, e2), -1);
      assert.strictEqual(sweepEventsComp(e2, e1), 1);
    });

    it('sweep event comparison y coordinates', () => {
      const e1 = new SweepEvent([0.0, 0.0], true, null, false, NORMAL);
      const e2 = new SweepEvent([0.0, 0.5], true, null, false, NORMAL);

      assert.strictEqual(sweepEventsComp(e1, e2), -1);
      assert.strictEqual(sweepEventsComp(e2, e1), 1);
    });

    it('sweep event comparison not left first', () => {
      const e1 = new SweepEvent([0.0, 0.0], true, null, false, NORMAL);
      const e2 = new SweepEvent([0.0, 0.0], false, null, false, NORMAL);

      assert.strictEqual(sweepEventsComp(e1, e2), 1);
      assert.strictEqual(sweepEventsComp(e2, e1), -1);
    });

    it('sweep event comparison shared start point not collinear edges', () => {
      const e1 = new SweepEvent([0.0, 0.0], true, new SweepEvent([1, 1], false, null, true), true);
      const e2 = new SweepEvent([0.0, 0.0], true, new SweepEvent([2, 3], false, null, true), true);

      assert.strictEqual(sweepEventsComp(e1, e2), -1, 'lower is processed first');
      assert.strictEqual(sweepEventsComp(e2, e1), 1,  'higher is processed second');
    });

    it('sweep event comparison collinear edges', () => {
      const e1 = new SweepEvent([0.0, 0.0], true, new SweepEvent([1, 1], false, null, true), true, NORMAL);
      const e2 = new SweepEvent([0.0, 0.0], true, new SweepEvent([2, 2], false, null, true), false, NORMAL);

      assert.strictEqual(sweepEventsComp(e1, e2), -1, 'clipping is processed first');
      assert.strictEqual(sweepEventsComp(e2, e1), 1,  'subject is processed second');
    });
  });
});
