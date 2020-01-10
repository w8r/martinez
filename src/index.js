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


export default function boolean(subject, clipping, operation) {
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

  // console.time('fill queue');
  const eventQueue = fillQueue(subject, clipping, sbbox, cbbox, operation);
  //console.timeEnd('fill queue');

  trivial = compareBBoxes(subject, clipping, sbbox, cbbox, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  // console.time('subdivide edges');
  const sortedEvents = subdivideSegments(eventQueue, subject, clipping, sbbox, cbbox, operation);
  //console.timeEnd('subdivide edges');

  // console.time('connect vertices');
  const result = connectEdges(sortedEvents, operation);
  // console.log(result)
  //console.timeEnd('connect vertices');

  const out = [];
  for (var i = 0; i < result.length; i++) {
    const contour = result[i];
    if (contour.external) {
      if (contour.points[0][0] !== contour.points[contour.points.length - 1][0] ||
          contour.points[0][1] !== contour.points[contour.points.length - 1][1]
      ) {
        contour.points.push([contour.points[0][0], contour.points[0][1]]);
      }

      const outCoords = [];
      outCoords.push(contour.points);
      for (var ii = 0; ii < contour.holes.length; ii++) {
        const requiredContour = contour.holes;
        if (result[requiredContour].points[0][0] !==
            result[requiredContour].points[result[requiredContour].points.length - 1][0] ||
            result[requiredContour].points[0][1] !==
            result[requiredContour].points[result[requiredContour].points.length - 1][1]
        ) {
           result[requiredContour].points([result[requiredContour].points[0], result[requiredContour].points[1]]);
        }

        outCoords.push(result[requiredContour].points);
      }
      out.push(outCoords);
    }
  }
  return out;
}
