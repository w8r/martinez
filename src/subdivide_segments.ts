import Tree from "splaytree";
import type Queue from "tinyqueue";
import { computeFields } from "./compute_fields";
import { possibleIntersection } from "./possible_intersection";
import { compareSegments } from "./compare_segments";
import { INTERSECTION, DIFFERENCE, OperationType } from "./operation";
import { SweepEvent } from "./sweep_event";
import { BoundingBox, Geometry } from "./types";

export function subdivideSegments(
  eventQueue: Queue<SweepEvent>,
  _0: Geometry,
  _1: Geometry,
  sbbox: BoundingBox,
  cbbox: BoundingBox,
  operation: OperationType
) {
  const sweepLine = new Tree(compareSegments);
  const sortedEvents: SweepEvent[] = [];

  const rightbound = Math.min(sbbox[2], cbbox[2]);

  let prev, next, begin;

  while (eventQueue.length !== 0) {
    let event = eventQueue.pop()!;
    console.log(event.point, event.left);
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

      const prevEvent = prev ? prev.key! : null;
      let prevprevEvent;
      computeFields(event, prevEvent, operation);
      if (next) {
        // @ts-expect-error
        if (possibleIntersection(event, next.key, eventQueue) === 2) {
          computeFields(event, prevEvent, operation);
          computeFields(next.key!, event, operation);
        }
      }

      if (prev) {
        // @ts-expect-error
        const pe = possibleIntersection(prev.key, event, eventQueue);
        if (pe === 2) {
          let prevprev = prev;
          if (prevprev !== begin) prevprev = sweepLine.prev(prevprev);
          // @ts-expect-error
          else prevprev = null;

          prevprevEvent = prevprev ? prevprev.key : null;
          computeFields(prevEvent!, prevprevEvent!, operation);
          computeFields(event, prevEvent, operation);
        }
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
          // @ts-expect-error
          possibleIntersection(prev.key, next.key, eventQueue);
        }
      }
    }
  }
  return sortedEvents;
}
