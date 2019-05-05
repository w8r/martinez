import compareEvents from './compare_events';
import { DIFFERENCE, OperationType } from './operation';
import SweepEvent from './sweep_event';
import { Contour, Polygon, Point, MultiPolygon } from './types';

function orderEvents(sortedEvents:SweepEvent[]) {
  let event:SweepEvent, i, len, tmp;
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


function nextPos(
  pos:number, resultEvents:SweepEvent[],
  processed:{ [index:number]: boolean }, origIndex:number
):number {
  console.log(resultEvents);
  let p, p1;
  let newPos = pos + 1;
  const length = resultEvents.length;

  p  = resultEvents[pos].point;

  if (newPos < length) p1 = resultEvents[newPos].point;

  // while in range and not the current one by value
  while (newPos < length && p1[0] === p[0] && p1[1] === p[1]) {
    if (!processed[newPos]) {
      return newPos;
    } else {
      newPos++;
    }
    try {
    p1 = resultEvents[newPos].point;
    } catch (e) {
      console.log(e, newPos, resultEvents.length);
    }
  }

  newPos = pos - 1;

  while (processed[newPos] && newPos >= origIndex) {
    newPos--;
  }
  return newPos;
}


export default function connectEdges(
  sortedEvents:SweepEvent[], 
  operation:OperationType
):MultiPolygon {
  let i, len;
  const resultEvents = orderEvents(sortedEvents);

  // "false"-filled array
  const processed:{[index:number]:boolean} = {};
  const result:MultiPolygon = [];
  let event;

  for (i = 0, len = resultEvents.length; i < len; i++) {
    if (processed[i]) continue;
    const contour:Polygon = [[]];

    if (!resultEvents[i].isExteriorRing) {
      if (operation === DIFFERENCE && !resultEvents[i].isSubject && result.length === 0) {
        result.push(contour);
      } else if (result.length === 0) {
        result.push([[]]);
      } else {
        result[result.length - 1].push(contour[0]);
      }
    } else if (operation === DIFFERENCE && !resultEvents[i].isSubject && result.length > 1) {
      result[result.length - 1].push(contour[0]);
    } else {
      result.push(contour);
    }

    const ringId = result.length - 1;
    let pos = i;

    const initial:Point = resultEvents[i].point;
    contour[0].push(initial);

    while (pos >= i) {
      event = resultEvents[pos];
      processed[pos] = true;

      if (event.left) {
        event.resultInOut = false;
        event.contourId   = ringId;
      } else {
        event.otherEvent.resultInOut = true;
        event.otherEvent.contourId   = ringId;
      }

      pos = event.pos;
      processed[pos] = true;
      contour[0].push(resultEvents[pos].point);
      pos = nextPos(pos, resultEvents, processed, i);
    }

    pos = pos === -1 ? i : pos;

    event = resultEvents[pos];
    processed[pos] = processed[event.pos] = true;
    event.otherEvent.resultInOut = true;
    event.otherEvent.contourId   = ringId;
  }

  // Handle if the result is a polygon (eg not multipoly)
  // Commented it again, let's see what do we mean by that
  // if (result.length === 1) result = result[0];
  return result;
}