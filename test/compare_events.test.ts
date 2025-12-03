import { describe, it, expect } from "vitest";
import Queue from "tinyqueue";
import sweepEventsComp from "../src/compare_events";
import SweepEvent from "../src/sweep_event";

describe("queue", () => {
  it("should process least(by x) sweep event first", () => {
    const queue = new Queue(undefined, sweepEventsComp);
    const e1 = { point: [0.0, 0.0] };
    const e2 = { point: [0.5, 0.5] };

    queue.push(e1);
    queue.push(e2);

    expect(queue.pop()).toBe(e1);
    expect(queue.pop()).toBe(e2);
  });

  it("should process least(by y) sweep event first", () => {
    const queue = new Queue(undefined, sweepEventsComp);
    const e1 = { point: [0.0, 0.0] };
    const e2 = { point: [0.0, 0.5] };

    queue.push(e1);
    queue.push(e2);

    expect(queue.pop()).toBe(e1);
    expect(queue.pop()).toBe(e2);
  });

  it("should pop least(by left prop) sweep event first", () => {
    const queue = new Queue(undefined, sweepEventsComp);
    const e1 = { point: [0.0, 0.0], left: true };
    const e2 = { point: [0.0, 0.0], left: false };

    queue.push(e1);
    queue.push(e2);

    expect(queue.pop()).toBe(e2);
    expect(queue.pop()).toBe(e1);
  });
});

describe("sweep event comparison x coordinates", () => {
  it("should compare x coordinates correctly", () => {
    const e1 = { point: [0.0, 0.0] };
    const e2 = { point: [0.5, 0.5] };

    expect(sweepEventsComp(e1, e2)).toBe(-1);
    expect(sweepEventsComp(e2, e1)).toBe(1);
  });
});

describe("sweep event comparison y coordinates", () => {
  it("should compare y coordinates correctly", () => {
    const e1 = { point: [0.0, 0.0] };
    const e2 = { point: [0.0, 0.5] };

    expect(sweepEventsComp(e1, e2)).toBe(-1);
    expect(sweepEventsComp(e2, e1)).toBe(1);
  });
});

describe("sweep event comparison not left first", () => {
  it("should process not left events first", () => {
    const e1 = { point: [0.0, 0.0], left: true };
    const e2 = { point: [0.0, 0.0], left: false };

    expect(sweepEventsComp(e1, e2)).toBe(1);
    expect(sweepEventsComp(e2, e1)).toBe(-1);
  });
});

describe("sweep event comparison shared start point not collinear edges", () => {
  it("should process lower edge first", () => {
    const e1 = new SweepEvent([0.0, 0.0], true, new SweepEvent([1, 1], false));
    const e2 = new SweepEvent([0.0, 0.0], true, new SweepEvent([2, 3], false));

    expect(sweepEventsComp(e1, e2)).toBe(-1);
    expect(sweepEventsComp(e2, e1)).toBe(1);
  });
});

describe("sweep event comparison collinear edges", () => {
  it("should process clipping before subject", () => {
    const e1 = new SweepEvent(
      [0.0, 0.0],
      true,
      new SweepEvent([1, 1], false),
      true
    );
    const e2 = new SweepEvent(
      [0.0, 0.0],
      true,
      new SweepEvent([2, 2], false),
      false
    );

    expect(sweepEventsComp(e1, e2)).toBe(-1);
    expect(sweepEventsComp(e2, e1)).toBe(1);
  });
});
