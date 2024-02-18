import { describe, it, assert } from "vitest";
import Tree from "splaytree";
import { compareSegments } from "../src/compare_segments";
import { compareEvents } from "../src/compare_events";
import { SweepEvent, sweepEvent } from "../src/sweep_event";
import { Point } from "../src/types";

describe("compare segments", () => {
  describe("not collinear", () => {
    it("shared left point - right point first", () => {
      const tree = new Tree(compareSegments);
      const pt: Point = [0.0, 0.0];
      const se1 = sweepEvent(pt, true, sweepEvent([1, 1], false));
      const se2 = sweepEvent(pt, true, sweepEvent([2, 3], false));

      tree.insert(se1);
      tree.insert(se2);

      assert.deepEqual(tree.maxNode().key!.otherEvent.point, [2, 3]);
      assert.deepEqual(tree.minNode().key!.otherEvent.point, [1, 1]);
    });

    it("different left point - right point y coord to sort", () => {
      const tree = new Tree(compareSegments);
      const se1 = sweepEvent([0, 1], true, sweepEvent([1, 1], false));
      const se2 = sweepEvent([0, 2], true, sweepEvent([2, 3], false));

      tree.insert(se1);
      tree.insert(se2);

      assert.deepEqual(tree.minNode().key!.otherEvent.point, [1, 1]);
      assert.deepEqual(tree.maxNode().key!.otherEvent.point, [2, 3]);
    });

    it("events order in sweep line", () => {
      const se1 = sweepEvent([0, 1], true, sweepEvent([2, 1], false));
      const se2 = sweepEvent([-1, 0], true, sweepEvent([2, 3], false));

      const se3 = sweepEvent([0, 1], true, sweepEvent([3, 4], false));
      const se4 = sweepEvent([-1, 0], true, sweepEvent([3, 1], false));

      assert.equal(compareEvents(se1, se2), 1);
      assert.isFalse(se2.isBelow(se1.point));
      assert.isTrue(se2.isAbove(se1.point));

      assert.equal(compareSegments(se1, se2), -1, "compare segments");
      assert.equal(compareSegments(se2, se1), 1, "compare segments inverted");

      assert.equal(compareEvents(se3, se4), 1);
      assert.isFalse(se4.isAbove(se3.point));
    });

    it("first point is below", () => {
      const se2 = sweepEvent([0, 1], true, sweepEvent([2, 1], false));
      const se1 = sweepEvent([-1, 0], true, sweepEvent([2, 3], false));

      assert.isFalse(se1.isBelow(se2.point));
      assert.equal(compareSegments(se1, se2), 1, "compare segments");
    });
  });

  it("collinear segments", () => {
    const se1 = sweepEvent([1, 1], true, sweepEvent([5, 1], false), true);
    const se2 = sweepEvent([2, 1], true, sweepEvent([3, 1], false), false);

    assert.notEqual(se1.isSubject, se2.isSubject);
    assert.equal(compareSegments(se1, se2), -1);
  });

  it("collinear shared left point", () => {
    const pt: Point = [0, 1];

    const se1 = sweepEvent(pt, true, sweepEvent([5, 1], false), false);
    const se2 = sweepEvent(pt, true, sweepEvent([3, 1], false), false);

    se1.contourId = 1;
    se2.contourId = 2;

    assert.equal(se1.isSubject, se2.isSubject);
    assert.equal(se1.point, se2.point);

    assert.equal(compareSegments(se1, se2), -1);

    se1.contourId = 2;
    se2.contourId = 1;

    assert.equal(compareSegments(se1, se2), +1);
  });

  it("collinear same polygon different left points", () => {
    const se1 = sweepEvent([1, 1], true, sweepEvent([5, 1], false), true);
    const se2 = sweepEvent([2, 1], true, sweepEvent([3, 1], false), true);

    assert.equal(se1.isSubject, se2.isSubject);
    assert.notEqual(se1.point, se2.point);
    assert.equal(compareSegments(se1, se2), -1);
    assert.equal(compareSegments(se2, se1), 1);
  });
});
