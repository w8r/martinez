import Queue           from 'tinyqueue';
import SweepEvent      from './sweep_event';
import compareEvents   from './compare_events';
import Operation, { DIFFERENCE }  from './operation';
import {
  MultiPolygon, BoundingBox,
  Polygon, Contour
} from './types';

let contourId = 0;

function processPolygon(
  contourOrHole:Contour,
  isSubject:boolean,
  depth:number,
  Q:Queue<SweepEvent>,
  bbox:BoundingBox,
  isExteriorRing:boolean
) {
  let i, len, s1, s2, e1, e2;
  for (i = 0, len = contourOrHole.length - 1; i < len; i++) {
    s1 = contourOrHole[i];
    s2 = contourOrHole[i + 1];
    e1 = new SweepEvent(s1, false, undefined, isSubject);
    e2 = new SweepEvent(s2, false, e1,        isSubject);
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
    else                           e1.left = true;

    const x = s1[0], y = s1[1];
    if (x < bbox[0]) bbox[0] = x;
    if (y < bbox[1]) bbox[1] = y;
    if (x > bbox[2]) bbox[2] = x;
    if (y > bbox[3]) bbox[3] = x;

    // Pushing it so the queue is sorted from left to right,
    // with object on the left having the highest priority.
    Q.push(e1);
    Q.push(e2);
  }
}


export default function fillQueue(
  subject:MultiPolygon,
  clipping:MultiPolygon,
  sbbox:BoundingBox,
  cbbox:BoundingBox,
  operation:Operation
):Queue<SweepEvent> {
  const Q = new Queue<SweepEvent>(undefined, compareEvents);
  let polygonSet:Polygon, isExteriorRing:boolean, i, ii, j, jj;

  for (i = 0, ii = subject.length; i < ii; i++) {
    polygonSet = subject[i];
    for (j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
      if (isExteriorRing) contourId++;
      processPolygon(polygonSet[j], true, contourId, Q, sbbox, isExteriorRing);
    }
  }

  for (i = 0, ii = clipping.length; i < ii; i++) {
    polygonSet = clipping[i];
    for (j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
      if (operation === DIFFERENCE) isExteriorRing = false;
      if (isExteriorRing) contourId++;
      processPolygon(polygonSet[j], false, contourId, Q, cbbox, isExteriorRing);
    }
  }

  return Q;
}
