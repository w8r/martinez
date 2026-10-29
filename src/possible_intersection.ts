import divideSegment from "./divide_segment";
import intersection from "./segment_intersection";
import equals, { nearlyEquals } from "./equals";
import compareEvents from "./compare_events";
import SweepEvent from "./sweep_event";
import { NON_CONTRIBUTING, SAME_TRANSITION, DIFFERENT_TRANSITION } from "./edge_type";
import EventQueue from "./event_queue";
import { Position } from "./types";

/**
 * Whether p is on the segment a1-a2, between its ends, up to floating-point noise
 */
function nearlyOnSegment(a1: Position, a2: Position, p: Position): boolean {
  const dx = a2[0] - a1[0],
    dy = a2[1] - a1[1];
  const t = ((p[0] - a1[0]) * dx + (p[1] - a1[1]) * dy) / (dx * dx + dy * dy);
  return t > 0 && t < 1 && nearlyEquals([a1[0] + t * dx, a1[1] + t * dy], p);
}

/**
 * Whether two segments sharing an endpoint lie on one line up to
 * floating-point noise, i.e. the other end of one is nearly on the other
 */
function nearlyCollinear(se1: SweepEvent, se2: SweepEvent): boolean {
  const a1 = se1.point,
    a2 = se1.otherEvent!.point,
    b1 = se2.point,
    b2 = se2.otherEvent!.point;
  return equals(a1, b1)
    ? nearlyOnSegment(a1, a2, b2) || nearlyOnSegment(b1, b2, a2)
    : nearlyOnSegment(a1, a2, b1) || nearlyOnSegment(b1, b2, a1);
}

export default function possibleIntersection(
  se1: SweepEvent,
  se2: SweepEvent,
  queue: Pick<EventQueue, "push">,
): number {
  // Segments of the same polygon are checked too: self-intersecting input
  // is allowed (skipping them "did cost us half a day" in the original port)
  const inter = intersection(se1.point, se1.otherEvent!.point, se2.point, se2.otherEvent!.point);

  if (inter === null) return 0; // no intersection
  let nintersections = inter.length;

  // Snap a crossing that lands a few ulps off an existing endpoint onto it.
  // Otherwise nearly collinear pieces keep producing new intersection points
  // just to the right of each other and the subdivision never ends (#98).
  if (nintersections === 1) {
    const endpoints = [se1.point, se1.otherEvent!.point, se2.point, se2.otherEvent!.point];
    for (const p of endpoints) {
      if (nearlyEquals(inter[0], p)) {
        inter[0] = p;
        break;
      }
    }
  }

  // the line segments intersect at an endpoint of both line segments
  if (
    nintersections === 1 &&
    (equals(se1.point, se2.point) || equals(se1.otherEvent!.point, se2.otherEvent!.point))
  ) {
    // Unless they are collinear up to floating-point noise: then one of them
    // is later split at the other's far end (snapped above), leaving two equal
    // edges that are never compared again (#189). Handle them as overlapping.
    if (se1.isSubject === se2.isSubject || !nearlyCollinear(se1, se2)) return 0;
    nintersections = 2;
  }

  if (nintersections === 2 && se1.isSubject === se2.isSubject) {
    // Overlapping edges of the same polygon are left as they are
    return 0;
  }

  // The line segments associated to se1 and se2 intersect
  if (nintersections === 1) {
    // if the intersection point is not an endpoint of se1
    if (!equals(se1.point, inter[0]) && !equals(se1.otherEvent!.point, inter[0])) {
      divideSegment(se1, inter[0], queue);
    }

    // if the intersection point is not an endpoint of se2
    if (!equals(se2.point, inter[0]) && !equals(se2.otherEvent!.point, inter[0])) {
      divideSegment(se2, inter[0], queue);
    }
    return 1;
  }

  // The line segments associated to se1 and se2 overlap
  const events: SweepEvent[] = [];
  let leftCoincide = false;
  let rightCoincide = false;

  if (equals(se1.point, se2.point)) {
    leftCoincide = true; // linked
  } else if (compareEvents(se1, se2) === 1) {
    events.push(se2, se1);
  } else {
    events.push(se1, se2);
  }

  if (equals(se1.otherEvent!.point, se2.otherEvent!.point)) {
    rightCoincide = true;
  } else if (compareEvents(se1.otherEvent!, se2.otherEvent!) === 1) {
    events.push(se2.otherEvent!, se1.otherEvent!);
  } else {
    events.push(se1.otherEvent!, se2.otherEvent!);
  }

  if ((leftCoincide && rightCoincide) || leftCoincide) {
    // both line segments are equal or share the left endpoint
    se2.type = NON_CONTRIBUTING;
    se1.type = se2.inOut === se1.inOut ? SAME_TRANSITION : DIFFERENT_TRANSITION;

    if (leftCoincide && !rightCoincide) {
      // honestly no idea, but changing events selection from [2, 1]
      // to [0, 1] fixes the overlapping self-intersecting polygons issue
      divideSegment(events[1].otherEvent!, events[0].point, queue);
    }
    return 2;
  }

  // the line segments share the right endpoint
  if (rightCoincide) {
    divideSegment(events[0], events[1].point, queue);
    return 3;
  }

  // no line segment includes totally the other one
  if (events[0] !== events[3].otherEvent!) {
    divideSegment(events[0], events[1].point, queue);
    divideSegment(events[1], events[2].point, queue);
    return 3;
  }

  // one line segment includes the other one
  divideSegment(events[0], events[1].point, queue);
  divideSegment(events[3].otherEvent!, events[2].point, queue);

  return 3;
}
