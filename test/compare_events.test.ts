import { describe, it, assert } from "vitest";
import Queue from "tinyqueue";
import { compareEvents as sweepEventsComp } from "../src/compare_events";
import { SweepEvent } from "../src/sweep_event";
import { NORMAL } from "../src/edge_type";

describe("compare events", () => {
  describe("queue", () => {
    it("queue should process lest(by x) sweep event first", () => {
      const queue = new Queue(undefined, sweepEventsComp);
      const e1 = { point: [0.0, 0.0] } as SweepEvent;
      const e2 = { point: [0.5, 0.5] } as SweepEvent;

      queue.push(e1);
      queue.push(e2);

      assert.equal(e1, queue.pop());
      assert.equal(e2, queue.pop());
    });

    it("queue should process lest(by y) sweep event first", () => {
      const queue = new Queue(undefined, sweepEventsComp);
      const e1 = { point: [0.0, 0.0] } as SweepEvent;
      const e2 = { point: [0.0, 0.5] } as SweepEvent;

      queue.push(e1);
      queue.push(e2);

      assert.equal(e1, queue.pop());
      assert.equal(e2, queue.pop());
    });

    it("queue should pop least(by left prop) sweep event first", () => {
      const queue = new Queue(undefined, sweepEventsComp);
      const e1 = { point: [0.0, 0.0], left: true } as SweepEvent;
      const e2 = { point: [0.0, 0.0], left: false } as SweepEvent;

      queue.push(e1);
      queue.push(e2);

      assert.equal(e2, queue.pop());
      assert.equal(e1, queue.pop());
    });
  });

  it("sweep event comparison x coordinates", () => {
    const e1 = { point: [0.0, 0.0] } as SweepEvent;
    const e2 = { point: [0.5, 0.5] } as SweepEvent;

    assert.equal(sweepEventsComp(e1, e2), -1);
    assert.equal(sweepEventsComp(e2, e1), 1);
  });

  it("sweep event comparison y coordinates", () => {
    const e1 = { point: [0.0, 0.0] } as SweepEvent;
    const e2 = { point: [0.0, 0.5] } as SweepEvent;

    assert.equal(sweepEventsComp(e1, e2), -1);
    assert.equal(sweepEventsComp(e2, e1), 1);
  });

  it("sweep event comparison not left first", () => {
    const e1 = { point: [0.0, 0.0], left: true } as SweepEvent;
    const e2 = { point: [0.0, 0.0], left: false } as SweepEvent;

    assert.equal(sweepEventsComp(e1, e2), 1);
    assert.equal(sweepEventsComp(e2, e1), -1);
  });

  it("sweep event comparison shared start point not collinear edges", () => {
    const e1 = new SweepEvent(
      [0.0, 0.0],
      true,
      new SweepEvent([1, 1], false, undefined, false, NORMAL),
      false,
      NORMAL
    );
    const e2 = new SweepEvent(
      [0.0, 0.0],
      true,
      new SweepEvent([2, 3], false, undefined, false, NORMAL),
      false,
      NORMAL
    );

    assert.equal(sweepEventsComp(e1, e2), -1, "lower is processed first");
    assert.equal(sweepEventsComp(e2, e1), 1, "higher is processed second");
  });

  it("sweep event comparison collinear edges", () => {
    const e1 = new SweepEvent(
      [0.0, 0.0],
      true,
      new SweepEvent([1, 1], false, undefined, false, NORMAL),
      true,
      NORMAL
    );
    const e2 = new SweepEvent(
      [0.0, 0.0],
      true,
      new SweepEvent([2, 2], false, undefined, false, NORMAL),
      false,
      NORMAL
    );

    assert.equal(sweepEventsComp(e1, e2), -1, "clipping is processed first");
    assert.equal(sweepEventsComp(e2, e1), 1, "subject is processed second");
  });
});
