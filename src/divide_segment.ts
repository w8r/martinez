import SweepEvent from "./sweep_event";
import compareEvents from "./compare_events";
import { Position } from "./types";
import EventQueue from "./event_queue";

export default function divideSegment(
  se: SweepEvent,
  p: Position,
  queue: Pick<EventQueue, "push">,
) {
  const r = new SweepEvent(p, false, se, se.isSubject);
  const l = new SweepEvent(p, true, se.otherEvent!, se.isSubject);

  r.contourId = l.contourId = se.contourId;

  // avoid a rounding error. The left event would be processed after the right event
  if (compareEvents(l, se.otherEvent!) > 0) {
    se.otherEvent!.left = true;
    l.left = false;
  }

  se.otherEvent!.otherEvent = l;
  se.otherEvent = r;

  queue.push(l);
  queue.push(r);

  return queue;
}
