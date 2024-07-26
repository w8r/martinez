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
  console.log("divide");
  const r = new SweepEvent(p, false, se, se.isSubject, NORMAL);
  const l = new SweepEvent(p, true, se.otherEvent, se.isSubject, NORMAL);

  if (equals(se.point, se.otherEvent.point)) {
    // eslint-disable-next-line no-console
    console.warn("what is that, a collapsed segment?", se);
  }

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

  console.log("push", l.point, r.point);
  queue.push(l);
  queue.push(r);

  console.log("\t peek", queue.peek().point);

  return queue;
}
