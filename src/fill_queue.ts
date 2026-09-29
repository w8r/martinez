import SweepEvent from "./sweep_event";
import compareEvents from "./compare_events";
import EventQueue from "./event_queue";
import { DIFFERENCE } from "./operation";
import { Position, Polygon, MultiPolygon, BBox } from "./types";

const max = Math.max;
const min = Math.min;

let contourId = 0;

function processPolygon(
  contourOrHole: Position[],
  isSubject: boolean,
  depth: number,
  Q: SweepEvent[],
  bbox: BBox,
  isExteriorRing: boolean
): void {
  let i: number,
    len: number,
    s1: Position,
    s2: Position,
    e1: SweepEvent,
    e2: SweepEvent;
  // Rings are expected to be closed (first point repeated at the end), but
  // an unclosed ring gets its closing edge added implicitly (#57).
  const last = contourOrHole.length - 1;
  const first = contourOrHole[0];
  const closed = first[0] === contourOrHole[last][0] && first[1] === contourOrHole[last][1];
  for (i = 0, len = closed ? last : last + 1; i < len; i++) {
    s1 = contourOrHole[i];
    s2 = i < last ? contourOrHole[i + 1] : first;
    e1 = new SweepEvent(s1, false, undefined, isSubject);
    e2 = new SweepEvent(s2, false, e1, isSubject);
    e1.otherEvent = e2;

    if (s1[0] === s2[0] && s1[1] === s2[1]) {
      continue; // skip collapsed edges, or it breaks
    }

    e1.contourId = e2.contourId = depth;
    if (!isExteriorRing) {
      e1.isExteriorRing = false;
      e2.isExteriorRing = false;
    }
    if (compareEvents(e1, e2) > 0) {
      e2.left = true;
    } else {
      e1.left = true;
    }

    const x = s1[0],
      y = s1[1];
    bbox[0] = min(bbox[0], x);
    bbox[1] = min(bbox[1], y);
    bbox[2] = max(bbox[2], x);
    bbox[3] = max(bbox[3], y);

    Q.push(e1, e2);
  }
}

export default function fillQueue(
  subject: MultiPolygon,
  clipping: MultiPolygon,
  sbbox: BBox,
  cbbox: BBox,
  operation: number
) {
  const events: SweepEvent[] = [];
  let polygonSet: Polygon,
    isExteriorRing: boolean,
    i: number,
    ii: number,
    j: number,
    jj: number; //, k, kk;

  for (i = 0, ii = subject.length; i < ii; i++) {
    polygonSet = subject[i];
    for (j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
      if (isExteriorRing) contourId++;
      processPolygon(
        polygonSet[j],
        true,
        contourId,
        events,
        sbbox,
        isExteriorRing
      );
    }
  }

  for (i = 0, ii = clipping.length; i < ii; i++) {
    polygonSet = clipping[i];
    for (j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
      if (operation === DIFFERENCE) isExteriorRing = false;
      if (isExteriorRing) contourId++;
      processPolygon(
        polygonSet[j],
        false,
        contourId,
        events,
        cbbox,
        isExteriorRing
      );
    }
  }

  // Sorted from left to right, with the leftmost event processed first.
  return new EventQueue(events.sort(compareEvents));
}
