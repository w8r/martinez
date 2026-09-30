import Tree, { Node } from "splaytree";
import computeFields from "./compute_fields";
import possibleIntersection from "./possible_intersection";
import compareSegments from "./compare_segments";
import compareEvents from "./compare_events";
import equals from "./equals";
import SweepEvent from "./sweep_event";
import { MultiPolygon, BBox } from "./types";
import { INTERSECTION, DIFFERENCE } from "./operation";
import EventQueue from "./event_queue";

export default function subdivide(
  eventQueue: EventQueue,
  subject: MultiPolygon,
  clipping: MultiPolygon,
  sbbox: BBox,
  cbbox: BBox,
  operation: number
): SweepEvent[] {
  const sweepLine = new Tree(compareSegments);
  const sortedEvents: SweepEvent[] = [];

  const rightbound = Math.min(sbbox[2], cbbox[2]);

  // Nodes in the sweep line always have a key, although splaytree's typings
  // declare it optional: hence the `.key!` below.
  let prev: Node<SweepEvent, unknown> | null,
    next: Node<SweepEvent, unknown> | null,
    begin: Node<SweepEvent, unknown> | null = null;

  while (eventQueue.length !== 0) {
    let event = eventQueue.pop()!;
    sortedEvents.push(event);

    // optimization by bboxes for intersection and difference goes here
    if (
      (operation === INTERSECTION && event.point[0] > rightbound) ||
      (operation === DIFFERENCE && event.point[0] > sbbox[2])
    ) {
      break;
    }

    if (event.left) {
      next = prev = event.node = sweepLine.insert(event);
      begin = sweepLine.minNode();

      if (prev !== begin) prev = sweepLine.prev(prev);
      else prev = null;

      next = sweepLine.next(next);

      const prevEvent = prev ? prev.key! : null;
      const queueLength = eventQueue.length;
      let prevprevEvent: SweepEvent | null;
      computeFields(event, prevEvent, operation);
      if (next) {
        if (possibleIntersection(event, next.key!, eventQueue) === 2) {
          computeFields(event, prevEvent, operation);
          computeFields(next.key!, event, operation);
        }
      }

      if (prev) {
        if (possibleIntersection(prev.key!, event, eventQueue) === 2) {
          let prevprev: Node<SweepEvent, unknown> | null = prev;
          if (prevprev !== begin) prevprev = sweepLine.prev(prevprev);
          else prevprev = null;

          prevprevEvent = prevprev ? prevprev.key! : null;
          computeFields(prev.key!, prevprevEvent, operation);
          computeFields(event, prevEvent, operation);
        }
      }

      // Splitting a neighbour at this event's point can queue events that
      // precede this one (e.g. the left half of a segment divided exactly at
      // our left endpoint). Our fields were computed without them, so take
      // this event out and process it again after them (#155).
      if (eventQueue.length > queueLength) {
        const top = eventQueue.peek()!;
        if (
          equals(top.point, event.point) &&
          compareEvents(top, event) === -1 &&
          compareEvents(event, top) === 1
        ) {
          sweepLine.removeNode(event.node!);
          event.node = null;
          sortedEvents.pop();
          eventQueue.push(event);
        }
      }
    } else {
      event = event.otherEvent!;
      // Use the node kept since insertion instead of searching the tree
      next = prev = event.node;

      if (prev && next) {
        if (prev !== begin) prev = sweepLine.prev(prev);
        else prev = null;

        next = sweepLine.next(next);
        sweepLine.removeNode(event.node!);
        event.node = null;

        if (next && prev) {
          possibleIntersection(prev.key!, next.key!, eventQueue);
        }
      }
    }
  }
  return sortedEvents;
}
