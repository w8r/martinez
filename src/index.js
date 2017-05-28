'use strict';

var Queue           = require('tinyqueue');
var Tree            = require('functional-red-black-tree');
var edgeType        = require('./edge_type');
var SweepEvent      = require('./sweep_event');
var compareEvents   = require('./compare_events');
var compareSegments = require('./compare_segments');
var intersection    = require('./segment_intersection');
var equals          = require('./equals');

var INTERSECTION = 0;
var UNION = 1;
var DIFFERENCE = 2;
var XOR = 3;
var EMPTY = [];

var max = Math.max;
var min = Math.min;

/**
 * @param  {Array<Number>} s1
 * @param  {Array<Number>} s2
 * @param  {Boolean}         isSubject
 * @param  {Queue}           eventQueue
 * @param  {Array<Number>}  bbox
 */
function processSegment(s1, s2, isSubject, depth, eventQueue, bbox, isExteriorRing) {
  // Possible degenerate condition.
  // if (equals(s1, s2)) return;

  var e1 = new SweepEvent(s1, false, undefined, isSubject);
  var e2 = new SweepEvent(s2, false, e1,        isSubject);
  e1.otherEvent = e2;

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

  bbox[0] = min(bbox[0], s1[0]);
  bbox[1] = min(bbox[1], s1[1]);
  bbox[2] = max(bbox[2], s1[0]);
  bbox[3] = max(bbox[3], s1[1]);

  // Pushing it so the queue is sorted from left to right,
  // with object on the left having the highest priority.
  eventQueue.push(e1);
  eventQueue.push(e2);
}

var contourId = 0;

function processPolygon(contourOrHole, isSubject, depth, queue, bbox, isExteriorRing) {
  var i, len;
  for (i = 0, len = contourOrHole.length - 1; i < len; i++) {
    processSegment(contourOrHole[i], contourOrHole[i + 1], isSubject, depth + 1, queue, bbox, isExteriorRing);
  }
}

function fillQueue(subject, clipping, sbbox, cbbox) {
  var eventQueue = new Queue(null, compareEvents);
  var polygonSet, isExteriorRing, i, ii, j, jj;

  for (i = 0, ii = subject.length; i < ii; i++) {
    polygonSet = subject[i];
    for (j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
      if (isExteriorRing) contourId++;
      processPolygon(polygonSet[j], true, contourId, eventQueue, sbbox, isExteriorRing);
    }
  }

  for (i = 0, ii = clipping.length; i < ii; i++) {
    polygonSet = clipping[i];
    for (j = 0, jj = polygonSet.length; j < jj; j++) {
      isExteriorRing = j === 0;
      if (isExteriorRing) contourId++;
      processPolygon(polygonSet[j], false, contourId, eventQueue, cbbox, isExteriorRing);
    }
  }

  return eventQueue;
}


/**
 * @param  {SweepEvent} event
 * @param  {SweepEvent} prev
 * @param  {Tree} sweepLine
 * @param  {Operation} operation
 * @return {[type]}
 */
function computeFields(event, prev, operation) {
  // compute inOut and otherInOut fields
  if (prev === null) {
    event.inOut      = false;
    event.otherInOut = true;

  // previous line segment in sweepline belongs to the same polygon
  } else {
    if (event.isSubject === prev.isSubject) {
      event.inOut      = !prev.inOut;
      event.otherInOut = prev.otherInOut;

    // previous line segment in sweepline belongs to the clipping polygon
    } else {
      event.inOut      = !prev.otherInOut;
      event.otherInOut = prev.isVertical() ? !prev.inOut : prev.inOut;
    }

    // compute prevInResult field
    if (prev) {
      event.prevInResult = (!inResult(prev, operation) || prev.isVertical()) ?
         prev.prevInResult : prev;
    }
  }

  // check if the line segment belongs to the Boolean operation
  event.inResult = inResult(event, operation);
}


function inResult(event, operation) {
  switch (event.type) {
  case edgeType.NORMAL:
    switch (operation) {
    case INTERSECTION:
      return !event.otherInOut;
    case UNION:
      return event.otherInOut;
    case DIFFERENCE:
      return (event.isSubject && event.otherInOut) ||
              (!event.isSubject && !event.otherInOut);
    case XOR:
      return true;
    }
    break;
  case edgeType.SAME_TRANSITION:
    return operation === INTERSECTION || operation === UNION;
  case edgeType.DIFFERENT_TRANSITION:
    return operation === DIFFERENCE;
  case edgeType.NON_CONTRIBUTING:
    return false;
  }
  return false;
}


/**
 * @param  {SweepEvent} se1
 * @param  {SweepEvent} se2
 * @param  {Queue}      queue
 * @return {Number}
 */
function possibleIntersection(se1, se2, queue) {
  // that disallows self-intersecting polygons,
  // did cost us half a day, so I'll leave it
  // out of respect
  // if (se1.isSubject === se2.isSubject) return;
  var inter = intersection(
    se1.point, se1.otherEvent.point,
    se2.point, se2.otherEvent.point
  );

  var nintersections = inter ? inter.length : 0;
  if (nintersections === 0) return 0; // no intersection

  // the line segments intersect at an endpoint of both line segments
  if ((nintersections === 1) &&
      (equals(se1.point, se2.point) ||
       equals(se1.otherEvent.point, se2.otherEvent.point))) {
    return 0;
  }

  if (nintersections === 2 && se1.isSubject === se2.isSubject) {
    // if(se1.contourId === se2.contourId){
    // console.warn('Edges of the same polygon overlap',
    //   se1.point, se1.otherEvent.point, se2.point, se2.otherEvent.point);
    // }
    //throw new Error('Edges of the same polygon overlap');
    return 0;
  }

  // The line segments associated to se1 and se2 intersect
  if (nintersections === 1) {

    // if the intersection point is not an endpoint of se1
    if (!equals(se1.point, inter[0]) && !equals(se1.otherEvent.point, inter[0])) {
      divideSegment(se1, inter[0], queue);
    }

    // if the intersection point is not an endpoint of se2
    if (!equals(se2.point, inter[0]) && !equals(se2.otherEvent.point, inter[0])) {
      divideSegment(se2, inter[0], queue);
    }
    return 1;
  }

  // The line segments associated to se1 and se2 overlap
  var events        = [];
  var leftCoincide  = false;
  var rightCoincide = false;

  if (equals(se1.point, se2.point)) {
    leftCoincide = true; // linked
  } else if (compareEvents(se1, se2) === 1) {
    events.push(se2, se1);
  } else {
    events.push(se1, se2);
  }

  if (equals(se1.otherEvent.point, se2.otherEvent.point)) {
    rightCoincide = true;
  } else if (compareEvents(se1.otherEvent, se2.otherEvent) === 1) {
    events.push(se2.otherEvent, se1.otherEvent);
  } else {
    events.push(se1.otherEvent, se2.otherEvent);
  }

  if ((leftCoincide && rightCoincide) || leftCoincide) {
    // both line segments are equal or share the left endpoint
    se1.type = edgeType.NON_CONTRIBUTING;
    se2.type = (se1.inOut === se2.inOut) ?
      edgeType.SAME_TRANSITION :
      edgeType.DIFFERENT_TRANSITION;

    if (leftCoincide && !rightCoincide) {
      // honestly no idea, but changing events selection from [2, 1]
      // to [0, 1] fixes the overlapping self-intersecting polygons issue
      divideSegment(events[1].otherEvent, events[0].point, queue);
    }
    return 2;
  }

  // the line segments share the right endpoint
  if (rightCoincide) {
    divideSegment(events[0], events[1].point, queue);
    return 3;
  }

  // no line segment includes totally the other one
  if (events[0] !== events[3].otherEvent) {
    divideSegment(events[0], events[1].point, queue);
    divideSegment(events[1], events[2].point, queue);
    return 3;
  }

  // one line segment includes the other one
  divideSegment(events[0], events[1].point, queue);
  divideSegment(events[3].otherEvent, events[2].point, queue);

  return 3;
}


/**
 * @param  {SweepEvent} se
 * @param  {Array.<Number>} p
 * @param  {Queue} queue
 * @return {Queue}
 */
function divideSegment(se, p, queue)  {
  var r = new SweepEvent(p, false, se,            se.isSubject);
  var l = new SweepEvent(p, true,  se.otherEvent, se.isSubject);

  if (equals(se.point, se.otherEvent.point)) {
    console.warn('what is that?', se);
  }

  r.contourId = l.contourId = se.contourId;

  // avoid a rounding error. The left event would be processed after the right event
  if (compareEvents(l, se.otherEvent) > 0) {
    se.otherEvent.left = true;
    l.left = false;
  }

  // avoid a rounding error. The left event would be processed after the right event
  // if (compareEvents(se, r) > 0) {}

  se.otherEvent.otherEvent = l;
  se.otherEvent = r;

  queue.push(l);
  queue.push(r);

  return queue;
}


/* eslint-disable no-unused-vars, no-debugger, no-undef */
function iteratorEquals(it1, it2) {
  return it1._cursor === it2._cursor;
}


function _renderSweepLine(sweepLine, pos, event) {
  var map = window.map;
  if (!map) return;
  if (window.sws) window.sws.forEach(function (p) {
    map.removeLayer(p);
  });
  window.sws = [];
  sweepLine.forEach(function (e) {
    var poly = L.polyline([
      e.point.slice().reverse(),
      e.otherEvent.point.slice().reverse()
    ], {color: 'green'}).addTo(map);
    window.sws.push(poly);
  });

  if (window.vt) map.removeLayer(window.vt);
  var v = pos.slice();
  var b = map.getBounds();
  window.vt = L.polyline([
    [b.getNorth(), v[0]],
    [b.getSouth(), v[0]]
  ], {color: 'green', weight: 1}).addTo(map);

  if (window.ps) map.removeLayer(window.ps);
  window.ps = L.polyline([
    event.point.slice().reverse(),
    event.otherEvent.point.slice().reverse()
  ], {color: 'black', weight: 9, opacity: 0.4}).addTo(map);
  debugger;
}
/* eslint-enable no-unused-vars, no-debugger, no-undef */


function subdivideSegments(eventQueue, subject, clipping, sbbox, cbbox, operation) {
  var sweepLine = new Tree(compareSegments);
  var sortedEvents = [];

  var rightbound = min(sbbox[2], cbbox[2]);

  var prev, next;

  while (eventQueue.length) {
    var event = eventQueue.pop();
    sortedEvents.push(event);

    // optimization by bboxes for intersection and difference goes here
    if ((operation === INTERSECTION && event.point[0] > rightbound) ||
        (operation === DIFFERENCE   && event.point[0] > sbbox[2])) {
      break;
    }

    if (event.left) {
      sweepLine = sweepLine.insert(event);
      //_renderSweepLine(sweepLine, event.point, event);

      next = sweepLine.find(event);
      prev = sweepLine.find(event);
      event.iterator = sweepLine.find(event);

      if (prev.node !== sweepLine.begin) {
        prev.prev();
      } else {
        prev = sweepLine.begin;
        prev.prev();
        prev.next();
      }
      next.next();

      var prevEvent = (prev.key || null), prevprevEvent;
      computeFields(event, prevEvent, operation);
      if (next.node) {
        if (possibleIntersection(event, next.key, eventQueue) === 2) {
          computeFields(event, prevEvent, operation);
          computeFields(event, next.key, operation);
        }
      }

      if (prev.node) {
        if (possibleIntersection(prev.key, event, eventQueue) === 2) {
          var prevprev = sweepLine.find(prev.key);
          if (prevprev.node !== sweepLine.begin) {
            prevprev.prev();
          } else {
            prevprev = sweepLine.find(sweepLine.end);
            prevprev.next();
          }
          prevprevEvent = prevprev.key || null;
          computeFields(prevEvent, prevprevEvent, operation);
          computeFields(event, prevEvent, operation);
        }
      }
    } else {
      event = event.otherEvent;
      next = sweepLine.find(event);
      prev = sweepLine.find(event);

      // _renderSweepLine(sweepLine, event.otherEvent.point, event);

      if (!(prev && next)) continue;

      if (prev.node !== sweepLine.begin) {
        prev.prev();
      } else {
        prev = sweepLine.begin;
        prev.prev();
        prev.next();
      }
      next.next();
      sweepLine = sweepLine.remove(event);

      // _renderSweepLine(sweepLine, event.otherEvent.point, event);

      if (next.node && prev.node) {
        if (typeof prev.node.value !== 'undefined' && typeof next.node.value !== 'undefined') {
          possibleIntersection(prev.key, next.key, eventQueue);
        }
      }
    }
  }
  return sortedEvents;
}


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
    resultEvents[i].pos = i;
  }

  for (i = 0, len = resultEvents.length; i < len; i++) {
    if (!resultEvents[i].left) {
      var temp = resultEvents[i].pos;
      resultEvents[i].pos = resultEvents[i].otherEvent.pos;
      resultEvents[i].otherEvent.pos = temp;
    }
  }

  return resultEvents;
}


/**
 * @param  {Array.<SweepEvent>} sortedEvents
 * @return {Array.<*>} polygons
 */
function connectEdges(sortedEvents) {
  var i, len;
  var resultEvents = orderEvents(sortedEvents);

  // "false"-filled array
  var processed = new Array(resultEvents.length);
  var result = [];

  for (i = 0, len = resultEvents.length; i < len; i++) {
    if (processed[i]) continue;
    var contour = [[]];

    if (!resultEvents[i].isExteriorRing) {
      result[result.length - 1].push([contour]);
    } else {
      result.push(contour);
    }

    var ringId = result.length - 1;
    var pos = i;

    var initial = resultEvents[i].point;
    // initial.push(resultEvents[i].isExteriorRing);
    contour[0].push(initial);

    while (pos >= i) {
      processed[pos] = true;

      if (resultEvents[pos].left) {
        resultEvents[pos].resultInOut = false;
        resultEvents[pos].contourId   = ringId;
      } else {
        resultEvents[pos].otherEvent.resultInOut = true;
        resultEvents[pos].otherEvent.contourId   = ringId;
      }

      pos = resultEvents[pos].pos;
      processed[pos] = true;
      // resultEvents[pos].point.push(resultEvents[pos].isExteriorRing);

      contour[0].push(resultEvents[pos].point);
      pos = nextPos(pos, resultEvents, processed);
    }

    pos = pos === -1 ? i : pos;

    processed[pos] = processed[resultEvents[pos].pos] = true;
    resultEvents[pos].otherEvent.resultInOut = true;
    resultEvents[pos].otherEvent.contourId   = ringId;
  }

  for (i = 0, len = result.length; i < len; i++) {
    var polygon = result[i];
    for (var j = 0, jj = polygon.length; j < jj; j++) {
      var polygonContour = polygon[j];
      for (var k = 0, kk = polygonContour.length; k < kk; k++) {
        var coords = polygonContour[k];
        if (typeof coords[0] !== 'number') {
          polygon.push(coords[0]);
          polygon.splice(j, 1);
        }
      }
    }
  }

  return result;
}


/**
 * @param  {Number} pos
 * @param  {Array.<SweepEvent>} resultEvents
 * @param  {Array.<Boolean>}    processed
 * @return {Number}
 */
function nextPos(pos, resultEvents, processed) {
  var newPos = pos + 1;
  var length = resultEvents.length;
  while (newPos < length &&
         equals(resultEvents[newPos].point, resultEvents[pos].point)) {
    if (!processed[newPos]) {
      return newPos;
    } else {
      newPos = newPos + 1;
    }
  }

  newPos = pos - 1;

  while (processed[newPos]) {
    newPos = newPos - 1;
  }
  return newPos;
}


function trivialOperation(subject, clipping, operation) {
  var result = null;
  if (subject.length * clipping.length === 0) {
    if (operation === INTERSECTION) {
      result = EMPTY;
    } else if (operation === DIFFERENCE) {
      result = subject;
    } else if (operation === UNION || operation === XOR) {
      result = (subject.length === 0) ? clipping : subject;
    }
  }
  return result;
}


function compareBBoxes(subject, clipping, sbbox, cbbox, operation) {
  var result = null;
  if (sbbox[0] > cbbox[2] ||
      cbbox[0] > sbbox[2] ||
      sbbox[1] > cbbox[3] ||
      cbbox[1] > sbbox[3]) {
    if (operation === INTERSECTION) {
      result = EMPTY;
    } else if (operation === DIFFERENCE) {
      result = subject;
    } else if (operation === UNION || operation === XOR) {
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
  var trivial = trivialOperation(subject, clipping, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  var sbbox = [Infinity, Infinity, -Infinity, -Infinity];
  var cbbox = [Infinity, Infinity, -Infinity, -Infinity];

  var eventQueue = fillQueue(subject, clipping, sbbox, cbbox);

  trivial = compareBBoxes(subject, clipping, sbbox, cbbox, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  var sortedEvents = subdivideSegments(eventQueue, subject, clipping, sbbox, cbbox, operation);
  return connectEdges(sortedEvents);
}


module.exports = boolean;


module.exports.union = function (subject, clipping) {
  return boolean(subject, clipping, UNION);
};


module.exports.diff = function (subject, clipping) {
  return boolean(subject, clipping, DIFFERENCE);
};


module.exports.xor = function (subject, clipping) {
  return boolean(subject, clipping, XOR);
};


module.exports.intersection = function (subject, clipping) {
  return boolean(subject, clipping, INTERSECTION);
};


/**
 * @enum {Number}
 */
module.exports.operations = {
  INTERSECTION: INTERSECTION,
  DIFFERENCE: DIFFERENCE,
  UNION: UNION,
  XOR: XOR
};


// for testing
module.exports.fillQueue            = fillQueue;
module.exports.computeFields        = computeFields;
module.exports.subdivideSegments    = subdivideSegments;
module.exports.divideSegment        = divideSegment;
module.exports.possibleIntersection = possibleIntersection;
