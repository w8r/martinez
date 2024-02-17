import { describe, it, assert } from "vitest";
import { SweepEvent } from "../src/sweep_event";
import { NORMAL } from "../src/edge_type";

describe("sweep event", () => {
  it("isBelow", () => {
    const s1 = new SweepEvent(
      [0, 0],
      true,
      new SweepEvent([1, 1], false, undefined, false, NORMAL),
      false,
      NORMAL
    );
    const s2 = new SweepEvent(
      [0, 1],
      false,
      new SweepEvent([0, 0], false, undefined, false, NORMAL),
      false,
      NORMAL
    );

    assert.isTrue(s1.isBelow([0, 1]));
    assert.isTrue(s1.isBelow([1, 2]));
    assert.isFalse(s1.isBelow([0, 0]));
    assert.isFalse(s1.isBelow([5, -1]));

    assert.isFalse(s2.isBelow([0, 1]));
    assert.isFalse(s2.isBelow([1, 2]));
    assert.isFalse(s2.isBelow([0, 0]));
    assert.isFalse(s2.isBelow([5, -1]));
  });

  it("isAbove", () => {
    const s1 = new SweepEvent(
      [0, 0],
      true,
      new SweepEvent([1, 1], false, undefined, false, NORMAL),
      false,
      NORMAL
    );
    const s2 = new SweepEvent(
      [0, 1],
      false,
      new SweepEvent([0, 0], false, undefined, false, NORMAL),
      false,
      NORMAL
    );

    assert.isFalse(s1.isAbove([0, 1]));
    assert.isFalse(s1.isAbove([1, 2]));
    assert.isTrue(s1.isAbove([0, 0]));
    assert.isTrue(s1.isAbove([5, -1]));

    assert.isTrue(s2.isAbove([0, 1]));
    assert.isTrue(s2.isAbove([1, 2]));
    assert.isTrue(s2.isAbove([0, 0]));
    assert.isTrue(s2.isAbove([5, -1]));
  });

  it("isVertical", () => {
    assert.isTrue(
      new SweepEvent(
        [0, 0],
        true,
        new SweepEvent([0, 1], false, undefined, false, NORMAL),
        false,
        NORMAL
      ).isVertical()
    );
    assert.isFalse(
      new SweepEvent(
        [0, 0],
        true,
        new SweepEvent([0.0001, 1], false, undefined, false, NORMAL),
        false,
        NORMAL
      ).isVertical()
    );
  });
});
