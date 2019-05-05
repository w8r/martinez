import { MultiPolygon, BoundingBox } from './types';
import { 
  INTERSECTION, DIFFERENCE, UNION, XOR,
  OperationType
} from './operation';
import { EMPTY } from './constants';
import fillQueue from './fill_queue';
import subdivideSegments from './subdivide_segments';
import connectEdges from './connect_edges';

function trivialOperation(
  subject:MultiPolygon, 
  clipping:MultiPolygon, 
  operation:OperationType
):MultiPolygon {
  let result = null;
  if (subject.length * clipping.length === 0) {
    if        (operation === INTERSECTION) {
      result = EMPTY;
    } else if (operation === DIFFERENCE) {
      result = subject;
    } else if (operation === UNION ||
               operation === XOR) {
      result = (subject.length === 0) ? clipping : subject;
    }
  }
  return result;
}


function compareBBoxes(
  subject:MultiPolygon, clipping:MultiPolygon, 
  sbbox:BoundingBox, cbbox:BoundingBox, 
  operation:OperationType
):MultiPolygon {
  let result = null;
  // they are far apart
  if (sbbox[0] > cbbox[2] ||
      cbbox[0] > sbbox[2] ||
      sbbox[1] > cbbox[3] ||
      cbbox[1] > sbbox[3]) {
    if        (operation === INTERSECTION) { // no intersection possible
      result = EMPTY;
    } else if (operation === DIFFERENCE) { // take the subject
      result = subject;
    } else if (operation === UNION ||
               operation === XOR) { // take both
      result = subject.concat(clipping);
    }
  }
  return result;
}


export default function (
  subject:MultiPolygon, 
  clipping:MultiPolygon, 
  operation:OperationType
):MultiPolygon|null {
  // 0. trivial cases
  let trivial = trivialOperation(subject, clipping, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  const sbbox:BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];
  const cbbox:BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];

  const eventQueue = fillQueue(subject, clipping, sbbox, cbbox, operation);

  trivial = compareBBoxes(subject, clipping, sbbox, cbbox, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }

  // 1. subdivide
  //console.time('subdivide edges');
  const sortedEvents = subdivideSegments(eventQueue, subject, clipping, sbbox, cbbox, operation);
  //console.timeEnd('subdivide edges');

  //console.time('connect vertices');
  const result = connectEdges(sortedEvents, operation);
  //console.timeEnd('connect vertices');
  // 2. mark
  // 3. connect
  return result;
}