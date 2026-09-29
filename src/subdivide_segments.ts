import Tree, { Node } from "splaytree";
import computeFields from "./compute_fields";
import possibleIntersection from "./possible_intersection";
import compareSegments from "./compare_segments";
import compareEvents from "./compare_events";
import equals from "./equals";
import SweepEvent from "./sweep_event";
import { MultiPolygon, BBox } from "./types";
import { INTERSECTION, DIFFERENCE } from "./operation";
import Queue from "tinyqueue";

export default function subdivide(
  eventQueue: Queue<SweepEvent>,
  subject: MultiPolygon,
  clipping: MultiPolygon,
  sbbox: BBox,
  cbbox: BBox,
  operation: number
): SweepEvent[] {
  const sweepLine = new Tree(compareSegments);
  const sortedEvents: SweepEvent[] = [];

  const rightbound = Math.min(sbbox[2], cbbox[2]);

  let prev: Node<SweepEvent, unknown>,
    next: Node<SweepEvent, unknown>,
    begin: Node<SweepEvent, unknown>;

  while (eventQueue.length !== 0) {
    let event: SweepEvent = eventQueue.pop();
    sortedEvents.push(event);

    // optimization by bboxes for intersection and difference goes here
    if (
      (operation === INTERSECTION && event.point[0] > rightbound) ||
      (operation === DIFFERENCE && event.point[0] > sbbox[2])
    ) {
      break;
    }

    if (event.left) {
      next = prev = sweepLine.insert(event);
      begin = sweepLine.minNode();

      if (prev !== begin) prev = sweepLine.prev(prev);
      else prev = null;

      next = sweepLine.next(next);

      const prevEvent = prev ? prev.key : null;
      let prevprevEvent;
      computeFields(event, prevEvent, operation);
      if (next) {
        if (possibleIntersection(event, next.key, eventQueue) === 2) {
          computeFields(event, prevEvent, operation);
          computeFields(next.key, event, operation);
        }
      }

      if (prev) {
        if (possibleIntersection(prev.key, event, eventQueue) === 2) {
          let prevprev = prev;
          if (prevprev !== begin) prevprev = sweepLine.prev(prevprev);
          else prevprev = null;

          prevprevEvent = prevprev ? prevprev.key : null;
          computeFields(prevEvent, prevprevEvent, operation);
          computeFields(event, prevEvent, operation);
        }
      }

      // Splitting a neighbour at this event's point can queue events that
      // precede this one (e.g. the left half of a segment divided exactly at
      // our left endpoint). Our fields were computed without them, so take
      // this event out and process it again after them (#155).
      const top = eventQueue.peek();
      if (
        top &&
        equals(top.point, event.point) &&
        compareEvents(top, event) === -1 &&
        compareEvents(event, top) === 1
      ) {
        sweepLine.remove(event);
        sortedEvents.pop();
        eventQueue.push(event);
      }
    } else {
      event = event.otherEvent;
      next = prev = sweepLine.find(event);

      if (prev && next) {
        if (prev !== begin) prev = sweepLine.prev(prev);
        else prev = null;

        next = sweepLine.next(next);
        sweepLine.remove(event);

        if (next && prev) {
          possibleIntersection(prev.key, next.key, eventQueue);
        }
      }
    }
  }
  return sortedEvents;
}
