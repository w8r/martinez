import SweepEvent    from './sweep_event';
import equals        from './equals';
import compareEvents from './compare_events';

function evt_to_str(e) {
  if (e == null) {
    return "null";
  } else if (e.left) {
    return `L ${e.point} => ${e.otherEvent.point}`
  } else {
    return `E ${e.otherEvent.point} <= ${e.point}`
  }
}

/**
 * @param  {SweepEvent} se
 * @param  {Array.<Number>} p
 * @param  {Queue} queue
 * @return {Queue}
 */
export default function divideSegment(se, p, queue)  {
  const r = new SweepEvent(p, false, se,            se.isSubject);
  const l = new SweepEvent(p, true,  se.otherEvent, se.isSubject);

  console.log("Dividing segment: " + evt_to_str(se) + " at " + p)

  /* eslint-disable no-console */
  if (equals(se.point, se.otherEvent.point)) {

    console.warn('what is that, a collapsed segment?', se);
  }
  /* eslint-enable no-console */

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

  console.log("Pushing l = " + evt_to_str(l))
  console.log("Pushing r = " + evt_to_str(r))

  queue.push(l);
  queue.push(r);

  return queue;
}
