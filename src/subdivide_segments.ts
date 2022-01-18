import Tree, { Node } from 'splaytree';
import computeFields from './compute_fields';
import possibleIntersection from './possible_intersection';
import compareSegments from './compare_segments';
import { INTERSECTION, DIFFERENCE, OperationType } from './operation';
import { BoundingBox, Queue } from './types';
import SweepEvent from './sweep_event';

type TreeNode = Node<SweepEvent, unknown>;

export default function subdivide(
  eventQueue: Queue,
  sbbox: BoundingBox,
  cbbox: BoundingBox,
  operation: OperationType
) {
  const sweepLine = new Tree(compareSegments);
  const sortedEvents: SweepEvent[] = [];

  const rightbound = Math.min(sbbox[2], cbbox[2]);

  let prev: TreeNode | null,
    next: TreeNode,
    begin: TreeNode = sweepLine.minNode();

  while (eventQueue.length !== 0) {
    let event = eventQueue.pop() as SweepEvent;
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

      const prevEvent = prev ? (prev.key as SweepEvent) : null;
      let prevprevEvent;
      computeFields(event, prevEvent, operation);
      if (next) {
        if (
          possibleIntersection(event, next.key as SweepEvent, eventQueue) === 2
        ) {
          computeFields(event, prevEvent, operation);
          computeFields(event, next.key as SweepEvent, operation);
        }
      }

      if (prev) {
        if (
          possibleIntersection(prev.key as SweepEvent, event, eventQueue) === 2
        ) {
          let prevprev: TreeNode | null = prev;
          if (prevprev !== begin) prevprev = sweepLine.prev(prevprev);
          else prevprev = null;

          prevprevEvent = prevprev ? (prevprev.key as SweepEvent) : null;
          computeFields(prevEvent as SweepEvent, prevprevEvent, operation);
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
          possibleIntersection(
            prev.key as SweepEvent,
            next.key as SweepEvent,
            eventQueue
          );
        }
      }
    }
  }
  return sortedEvents;
}
