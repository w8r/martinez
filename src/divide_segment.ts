import { SweepEvent } from "./sweep_event";
import { equals } from "./equals";
import { compareEvents } from "./compare_events";
import { NORMAL } from "./edge_type";
import { Point } from "./types";
import type Queue from "tinyqueue";

/**
 * @param  {SweepEvent} se
 * @param  {Array.<Number>} p
 * @param  {Queue} queue
 * @return {Queue}
 */
export function divideSegment(
  se: SweepEvent,
  p: Point,
  queue: Queue<SweepEvent>
) {
  console.log("divide", se, "at", p);
  const r = new SweepEvent(p, false, se, se.isSubject, NORMAL);
  const l = new SweepEvent(p, true, se.otherEvent, se.isSubject, NORMAL);

  /* eslint-disable no-console */
  if (equals(se.point, se.otherEvent.point)) {
    console.warn("what is that, a collapsed segment?", se);
  }
  /* eslint-enable no-console */

  r.contourId = l.contourId = se.contourId;

  // avoid a rounding error. The left event would be processed after the right event
  if (compareEvents(l, se.otherEvent) > 0) {
    se.otherEvent.left = true;
    l.left = false;
  }

  // avoid a rounding error. The left event would be processed after the right event
  // if (compareEvents(se, r) > 0) {}

  se.otherEvent.otherEvent = l;
  se.otherEvent = r;

  queue.push(l);
  queue.push(r);

  return queue;
}
