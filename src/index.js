import subdivideSegments from './subdivide_segments';
import connectEdges      from './connect_edges';
import fillQueue         from './fill_queue';
import {
  INTERSECTION,
  DIFFERENCE,
  UNION,
  XOR
}        from './operation';

const EMPTY = [];


function trivialOperation(subject, clipping, operation) {
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


function compareBBoxes(subject, clipping, sbbox, cbbox, operation) {
  let result = null;
  if (sbbox[0] > cbbox[2] ||
      cbbox[0] > sbbox[2] ||
      sbbox[1] > cbbox[3] ||
      cbbox[1] > sbbox[3]) {
    if        (operation === INTERSECTION) {
      result = EMPTY;
    } else if (operation === DIFFERENCE) {
      result = subject;
    } else if (operation === UNION ||
               operation === XOR) {
      result = subject.concat(clipping);
    }
  }
  return result;
}


function boolean(subject, clipping, operation) {
  if (typeof subject[0][0][0] === 'number') {
    subject = [subject];
  }
  if (typeof clipping[0][0][0] === 'number') {
    clipping = [clipping];
  }
  let trivial = trivialOperation(subject, clipping, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  const sbbox = [Infinity, Infinity, -Infinity, -Infinity];
  const cbbox = [Infinity, Infinity, -Infinity, -Infinity];

  //console.time('fill queue');
  const eventQueue = fillQueue(subject, clipping, sbbox, cbbox, operation);
  //console.timeEnd('fill queue');

  trivial = compareBBoxes(subject, clipping, sbbox, cbbox, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  //console.time('subdivide edges');
  const sortedEvents = subdivideSegments(eventQueue, subject, clipping, sbbox, cbbox, operation);
  //console.timeEnd('subdivide edges');

  //console.time('connect vertices');
  const result = connectEdges(sortedEvents, operation);
  //console.timeEnd('connect vertices');
  return result;
}

boolean.union        = (subject, clipping) => boolean(subject, clipping, UNION);
boolean.diff         = (subject, clipping) => boolean(subject, clipping, DIFFERENCE);
boolean.xor          = (subject, clipping) => boolean(subject, clipping, XOR);
boolean.intersection = (subject, clipping) => boolean(subject, clipping, INTERSECTION);

export default boolean;

export const union = boolean.union;
export const diff = boolean.diff;
export const xor = boolean.xor;
export const intersection = boolean.intersection;

/**
 * @enum {Number}
 */
export const operations = { UNION, DIFFERENCE, INTERSECTION, XOR };
