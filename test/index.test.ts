import path from "path";
import load from "load-json-file";
import { describe, it, assert, beforeEach } from "vitest";
import { fillQueue } from "../src/fill_queue";
import { INTERSECTION } from "../src/operation";
import { BoundingBox } from "../src/types";

// GeoJSON Data
const data = load.sync(
  path.join(__dirname, "fixtures", "two_triangles.geojson")
);

const subject = data.features[0];
const clipping = data.features[1];

describe("fill event queue", () => {
  const s = [subject.geometry.coordinates];
  const c = [clipping.geometry.coordinates];

  const sbbox: BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];
  const cbbox: BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];
  const q = fillQueue(s, c, sbbox, cbbox, INTERSECTION);
  let currentPoint;

  it("bboxes", () => {
    assert.deepEqual(sbbox, [20, -113.5, 226.5, 74], "subject bbox");
    assert.deepEqual(cbbox, [54.5, -198, 239.5, 33.5], "clipping bbox");
  });

  it("point 0", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [20, -23.5]); /* s[0][0] */
    assert.isOk(currentPoint.left, "is left");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [226.5, -113.5],
      "other event"
    ); /* s[0][2] */
    assert.notOk(currentPoint.otherEvent.left, "other event is right");
  });

  it("point 1", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [20, -23.5]); /* s[0][0] */
    assert.isOk(currentPoint.left, "is left");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [170, 74],
      "other event"
    ); /* s[0][1] */
    assert.notOk(currentPoint.otherEvent.left, "other event is right");
  });

  it("point 2", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [54.5, -170.5]); /* c[0][0] */
    assert.isOk(currentPoint.left, "is left");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [239.5, -198],
      "other event"
    ); /* c[0][2] */
    assert.notOk(currentPoint.otherEvent.left, "other event is right");
  });

  it("point 3", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [54.5, -170.5]); /* c[0][0] */
    assert.isOk(currentPoint.left, "is left");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [140.5, 33.5],
      "other event"
    ); /* c[0][1] */
    assert.notOk(currentPoint.otherEvent.left, "other event is right");
  });

  it("point 4", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [140.5, 33.5]); /* c[0][0] */
    assert.notOk(currentPoint.left, "is right");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [54.5, -170.5],
      "other event"
    ); /* c[0][1] */
    assert.isOk(currentPoint.otherEvent.left, "other event is left");
  });

  it("point 5", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [140.5, 33.5]); /* c[0][0] */
    assert.isOk(currentPoint.left, "is left");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [239.5, -198],
      "other event"
    ); /* c[0][1] */
    assert.notOk(currentPoint.otherEvent.left, "other event is right");
  });

  it("point 6", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [170, 74]); /* s[0][1] */
    assert.notOk(currentPoint.left, "is right");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [20, -23.5],
      "other event"
    ); /* s[0][0] */
    assert.isOk(currentPoint.otherEvent.left, "other event is left");
  });

  it("point 7", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [170, 74]); /* s[0][1] */
    assert.isOk(currentPoint.left, "is left");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [226.5, -113.5],
      "other event"
    ); /* s[0][3] */
    assert.notOk(currentPoint.otherEvent.left, "other event is right");
  });

  it("point 8", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [226.5, -113.5]); /* s[0][1] */
    assert.notOk(currentPoint.left, "is right");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [20, -23.5],
      "other event"
    ); /* s[0][0] */
    assert.isOk(currentPoint.otherEvent.left, "other event is left");
  });

  it("point 9", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [226.5, -113.5]); /* s[0][1] */
    assert.notOk(currentPoint.left, "is right");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [170, 74],
      "other event"
    ); /* s[0][0] */
    assert.isOk(currentPoint.otherEvent.left, "other event is left");
  });

  it("point 10", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [239.5, -198]); /* c[0][2] */
    assert.notOk(currentPoint.left, "is right");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [54.5, -170.5],
      "other event"
    ); /* c[0][0] */
    assert.isOk(currentPoint.otherEvent.left, "other event is left");
  });

  it("point 11", () => {
    currentPoint = q.pop();
    assert.deepEqual(currentPoint.point, [239.5, -198]); /* c[0][2] */
    assert.notOk(currentPoint.left, "is right");
    assert.deepEqual(
      currentPoint.otherEvent.point,
      [140.5, 33.5],
      "other event"
    ); /* s[0][1] */
    assert.isOk(currentPoint.otherEvent.left, "other event is left");
  });
});
