import compareEvents from './compare_events';
import Contour from './contour';

/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<SweepEvent>}
 */
function orderEvents(sortedEvents) {
  let event, i, len, tmp;
  const resultEvents = [];
  for (i = 0, len = sortedEvents.length; i < len; i++) {
    event = sortedEvents[i];
    if ((event.left && event.inResult) ||
      (!event.left && event.otherEvent.inResult)) {
      resultEvents.push(event);
    }
  }
  // Due to overlapping edges the resultEvents array can be not wholly sorted
  let sorted = false;
  while (!sorted) {
    sorted = true;
    for (i = 0, len = resultEvents.length; i < len; i++) {
      if ((i + 1) < len &&
        compareEvents(resultEvents[i], resultEvents[i + 1]) === 1) {
        tmp = resultEvents[i];
        resultEvents[i] = resultEvents[i + 1];
        resultEvents[i + 1] = tmp;
        sorted = false;
      }
    }
  }


  for (i = 0, len = resultEvents.length; i < len; i++) {
    event = resultEvents[i];
    event.pos = i;
  }

  // imagine, the right event is found in the beginning of the queue,
  // when his left counterpart is not marked yet
  for (i = 0, len = resultEvents.length; i < len; i++) {
    event = resultEvents[i];
    if (!event.left) {
      tmp = event.pos;
      event.pos = event.otherEvent.pos;
      event.otherEvent.pos = tmp;
    }
  }

  return resultEvents;
}


/**
 * @param  {Number} pos
 * @param  {Array.<SweepEvent>} resultEvents
 * @param  {Object>}    processed
 * @return {Number}
 */
function nextPos(pos, resultEvents, processed) {
  let newPos = pos + 1,
      p = resultEvents[pos].point,
      p1;
  const length = resultEvents.length;


  if (newPos < length)
    p1 = resultEvents[newPos].point;


  // while in range and not the current one by value
  while (newPos < length && p1[0] === p[0] && p1[1] === p[1]) {

    // if (newPos === -1) {
    //   throw `Problem with pos, ${pos}, ${newPos}`;
    // }
    if (!processed[newPos]) {
      return newPos;
    } else   {
      newPos++;
    }
    p1 = resultEvents[newPos].point;
  }

  newPos = pos - 1;

  while (processed[newPos]) {
    newPos--;
  }

  return newPos;
}


/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<*>} polygons
 */
export default function connectEdges(sortedEvents) {
  let i, len;
  const resultEvents = orderEvents(sortedEvents);

  // "false"-filled array
  const processed = {};
  const result = [];
  let event;
  let depth = [];
  let holeOf = [];

  for (i = 0, len = resultEvents.length; i < len; i++) {

    if (processed[i]) continue;
    const contour = new Contour();
    result.push(contour);

    let contourId = result.length - 1;
    depth.push(0);
    holeOf.push(-1);

    if (resultEvents[i].prevInResult !== null) {
      const lowerContourId = resultEvents[i].prevInResult.contourId;
      if (!resultEvents[i].prevInResult.resultInOut) {
        result[lowerContourId].holes.push(contourId);
        holeOf[contourId] = lowerContourId;
        depth[contourId] = depth[lowerContourId] + 1;
        contour.external = false;
      } else if (!result[lowerContourId].external) {
        result[holeOf[lowerContourId]].holes.push(contourId);
        holeOf[contourId] = holeOf[lowerContourId];
        depth[contourId] = depth[lowerContourId];
        contour.external = false;
      }
    }

    let pos = i;

    const initial = resultEvents[i].point;
    contour.points.push(initial);


    while (resultEvents[pos] && resultEvents[pos].otherEvent.point !== initial) {
        event = resultEvents[pos];
        processed[pos] = true;

        if (event.left) {
          event.resultInOut = false;
          event.contourId   = contourId;
        } else {
          event.otherEvent.resultInOut = true;
          event.otherEvent.contourId  = contourId;
        }

        pos = event.pos;
        processed[pos] = true;
        contour.points.push(resultEvents[pos].point);
        pos = nextPos(pos, resultEvents, processed);
    }
    pos = pos === -1 ? i : pos;

    event = resultEvents[pos];
    processed[pos] = processed[event.pos] = true;
    event.otherEvent.resultInOut = true;
    event.otherEvent.contourId   = contourId;
  }

  return result;
}
