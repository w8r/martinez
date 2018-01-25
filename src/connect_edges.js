'use strict';

// var equals = require('./equals');
var compareEvents = require('./compare_events');
var operationType = require('./operation');

/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<SweepEvent>}
 */
function orderEvents(sortedEvents) {
  var event, i, len, tmp;
  var resultEvents = [];
  for (i = 0, len = sortedEvents.length; i < len; i++) {
    event = sortedEvents[i];
    if ((event.left && event.inResult) ||
      (!event.left && event.otherEvent.inResult)) {
      resultEvents.push(event);
    }
  }
  // Due to overlapping edges the resultEvents array can be not wholly sorted
  var sorted = false;
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
function nextPos(pos, resultEvents, processed, origIndex) {
  var newPos = pos + 1;
  var length = resultEvents.length;
  if (newPos > length - 1) return pos - 1;
  var p  = resultEvents[pos].point;
  var p1 = resultEvents[newPos].point;


  // while in range and not the current one by value
  while (newPos < length && p1[0] === p[0] && p1[1] === p[1]) {
    if (!processed[newPos]) {
      return newPos;
    } else   {
      newPos++;
    }
    p1 = resultEvents[newPos].point;
  }

  newPos = pos - 1;

  while (processed[newPos] && newPos >= origIndex) {
    newPos--;
  }
  return newPos;
}


/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<*>} polygons
 */
module.exports = function connectEdges(sortedEvents, operation) {
  var i, len;
  var resultEvents = orderEvents(sortedEvents);

  // "false"-filled array
  var processed = {};
  var result = [];
  var event;

  for (i = 0, len = resultEvents.length; i < len; i++) {
    if (processed[i]) continue;
    var contour = [[]];

    if (!resultEvents[i].isExteriorRing) {
      if (operation === operationType.DIFFERENCE && !resultEvents[i].isSubject && result.length === 0) {
        result.push(contour);
      } else if (result.length === 0) {
        result.push([[contour]]);
      } else {
        result[result.length - 1].push(contour[0]);
      }
    } else if (operation === operationType.DIFFERENCE && !resultEvents[i].isSubject && result.length > 1) {
      result[result.length - 1].push(contour[0]);
    } else {
      result.push(contour);
    }

    var ringId = result.length - 1;
    var pos = i;

    var initial = resultEvents[i].point;
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

  // for (i = 0, len = result.length; i < len; i++) {
  //   var polygon = result[i];
  //   for (var j = 0, jj = polygon.length; j < jj; j++) {
  //     var polygonContour = polygon[j];
  //     for (var k = 0, kk = polygonContour.length; k < kk; k++) {
  //       var coords = polygonContour[k];
  //       if (typeof coords[0] !== 'number') {
  //         polygon.splice(j, 1);
  //         polygon.push(coords);
  //       }
  //     }
  //   }
  // }

  // Handle if the result is a polygon (eg not multipoly)
  // Commented it again, let's see what do we mean by that
  // if (result.length === 1) result = result[0];
  return result;
};
