import BunaryQueue from 'tinyqueue';
import SweepEvent from './sweep_event';
import compareEvents from './compare_events';
import { DIFFERENCE, OperationType } from './operation';
import { BoundingBox, Contour, ContourId, MultiPolygon, Queue } from './types';

const max = Math.max;
const min = Math.min;

let contourId: ContourId = 0;

function processPolygon(
  contourOrHole: Contour,
  isSubject: boolean,
  depth: number,
  Q: Queue,
  bbox: BoundingBox,
  isExteriorRing: boolean
) {
  for (let i = 0, len = contourOrHole.length - 1; i < len; i++) {
    const s1 = contourOrHole[i];
    const s2 = contourOrHole[i + 1];
    const e1 = new SweepEvent(s1, false, null, isSubject);
    const e2 = new SweepEvent(s2, false, e1, isSubject);
    e1.otherEvent = e2;

    // skip collapsed edges, or it breaks
    if (s1[0] === s2[0] && s1[1] === s2[1]) continue;

    e1.contourId = e2.contourId = depth;
    if (!isExteriorRing) {
      e1.isExteriorRing = false;
      e2.isExteriorRing = false;
    }
    if (compareEvents(e1, e2) > 0) e2.left = true;
    else e1.left = true;

    const [x, y] = s1;
    bbox[0] = min(bbox[0], x);
    bbox[1] = min(bbox[1], y);
    bbox[2] = max(bbox[2], x);
    bbox[3] = max(bbox[3], y);

    // Pushing it so the queue is sorted from left to right,
    // with object on the left having the highest priority.
    Q.push(e1);
    Q.push(e2);
  }
}

export default function fillQueue(
  subject: MultiPolygon,
  clipping: MultiPolygon,
  sbbox: BoundingBox,
  cbbox: BoundingBox,
  operation: OperationType
): Queue {
  const eventQueue = new BunaryQueue<SweepEvent>(undefined, compareEvents);
  let polygonSet, isExteriorRing; //, k, kk;

  for (let i = 0, ii = subject.length; i < ii; i++) {
    polygonSet = subject[i];
    for (let j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
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
    polygonSet = clipping[i];
    for (let j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
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
