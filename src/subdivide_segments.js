import Tree                 from 'splaytree';
import computeFields        from './compute_fields';
import possibleIntersection from './possible_intersection';
import compareSegments      from './compare_segments';
import {
  INTERSECTION,
  DIFFERENCE
} from './operation';


function evt_to_str(e) {
  if (e == null) {
    return "null";
  } else if (e.left) {
    return `L ${e.point} => ${e.otherEvent.point}`
  } else {
    return `E ${e.otherEvent.point} <= ${e.point}`
  }
}
function printSweepLine(sweepLine) {
  console.log("Sweepline:");
  var lines = [];
  sweepLine.forEach(node => {
    lines.push(`${evt_to_str(node.key)} => ${node.data}`)
  })
  lines = lines.reverse();
  for (let line of lines) {
    console.log(line);
  }
}

export default function subdivide(eventQueue, subject, clipping, sbbox, cbbox, operation) {
  console.log("Entering 'subdivide'");
  const sweepLine = new Tree(compareSegments);
  const sortedEvents = [];

  const rightbound = Math.min(sbbox[2], cbbox[2]);

  let prev, next, begin;

  while (eventQueue.length !== 0) {
    let event = eventQueue.pop();
    sortedEvents.push(event);

    //console.log("Handling event: ", event);
    console.log("\n *** Processing Event: " + evt_to_str(event))
    printSweepLine(sweepLine);

    // optimization by bboxes for intersection and difference goes here
    if ((operation === INTERSECTION && event.point[0] > rightbound) ||
        (operation === DIFFERENCE   && event.point[0] > sbbox[2])) {
      break;
    }

    if (event.left) {
      next  = prev = sweepLine.insert(event);
      begin = sweepLine.minNode();

      if (prev !== begin) prev = sweepLine.prev(prev);
      else                prev = null;

      next = sweepLine.next(next);

      console.log("next: " + evt_to_str(next ? next.key : null))
      console.log("prev: " + evt_to_str(prev ? prev.key : null))

      const prevEvent = prev ? prev.key : null;
      let prevprevEvent;
      computeFields(event, prevEvent, operation);
      if (next) {
        if (possibleIntersection(event, next.key, eventQueue) === 2) {
          console.log("Intersects with next");
          computeFields(event, prevEvent, operation);
          computeFields(event, next.key, operation);
        }
      }

      if (prev) {
        if (possibleIntersection(prev.key, event, eventQueue) === 2) {
          console.log("Intersects with prev");
          let prevprev = prev;
          if (prevprev !== begin) prevprev = sweepLine.prev(prevprev);
          else                    prevprev = null;

          prevprevEvent = prevprev ? prevprev.key : null;
          computeFields(prevEvent, prevprevEvent, operation);
          computeFields(event,     prevEvent,     operation);
        }
      }
    } else {
      event = event.otherEvent;
      next = prev = sweepLine.find(event);

      if (prev && next) {

        if (prev !== begin) prev = sweepLine.prev(prev);
        else                prev = null;

        next = sweepLine.next(next);
        sweepLine.remove(event);

        if (next && prev) {
          console.log("Checking for intersection between adjacent segments after removal");
          possibleIntersection(prev.key, next.key, eventQueue);
        }
      }
    }
    printSweepLine(sweepLine);
  }
  return sortedEvents;
}
