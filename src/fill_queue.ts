import Queue from "tinyqueue";
import { SweepEvent } from "./sweep_event";
import { compareEvents } from "./compare_events";
import { DIFFERENCE, OperationType } from "./operation";
import { NORMAL } from "./edge_type";
import { BoundingBox, MultiPolygon, Point } from "./types";

let contourId = 0;

function processPolygon(
  contourOrHole: Point[],
  isSubject: boolean,
  depth: number,
  Q: Queue<SweepEvent>,
  bbox: BoundingBox,
  isExteriorRing: boolean
) {
  for (let i = 0, len = contourOrHole.length - 1; i < len; i++) {
    const s1 = contourOrHole[i];
    const s2 = contourOrHole[i + 1];
    const e1 = new SweepEvent(
      s1,
      false,
      undefined as unknown as SweepEvent,
      isSubject,
      NORMAL
    );
    const e2 = new SweepEvent(s2, false, e1, isSubject, NORMAL);
    e1.otherEvent = e2;

    if (s1[0] === s2[0] && s1[1] === s2[1]) {
      continue; // skip collapsed edges, or it breaks
    }

    e1.contourId = e2.contourId = depth;
    if (!isExteriorRing) {
      e1.isExteriorRing = false;
      e2.isExteriorRing = false;
    }
    if (compareEvents(e1, e2) > 0) e2.left = true;
    else e1.left = true;

    const x = s1[0];
    const y = s1[1];
    bbox[0] = Math.min(bbox[0], x);
    bbox[1] = Math.min(bbox[1], y);
    bbox[2] = Math.max(bbox[2], x);
    bbox[3] = Math.max(bbox[3], y);

    // Pushing it so the queue is sorted from left to right,
    // with object on the left having the highest priority.
    Q.push(e1);
    Q.push(e2);
  }
}

export function fillQueue(
  subject: MultiPolygon,
  clipping: MultiPolygon,
  sbbox: BoundingBox,
  cbbox: BoundingBox,
  operation: OperationType
) {
  const eventQueue = new Queue<SweepEvent>(undefined, compareEvents);

  for (let i = 0, ii = subject.length; i < ii; i++) {
    const polygonSet = subject[i];
    for (let j = 0, jj = polygonSet.length; j < jj; j++) {
      const isExteriorRing = j === 0;
      if (isExteriorRing) contourId++;
      processPolygon(
        polygonSet[j],
        true,
        contourId,
        eventQueue,
        sbbox,
        isExteriorRing
      );
    }
  }

  for (let i = 0, ii = clipping.length; i < ii; i++) {
    const polygonSet = clipping[i];
    for (let j = 0, jj = polygonSet.length; j < jj; j++) {
      let isExteriorRing = j === 0;
      if (operation === DIFFERENCE) isExteriorRing = false;
      if (isExteriorRing) contourId++;
      processPolygon(
        polygonSet[j],
        false,
        contourId,
        eventQueue,
        cbbox,
        isExteriorRing
      );
    }
  }

  return eventQueue;
}
