import signedArea    from './signed_area';
import compareEvents from './compare_events';
import equals        from './equals';


/**
 * @param  {SweepEvent} le1
 * @param  {SweepEvent} le2
 * @return {Number}
 */
export default function compareSegments(le1, le2) {
  if (le1 === le2) return 0;

  // Segments are not collinear
   if (signedArea(le1.point, le1.otherEvent.point, le2.point) !== 0 ||
       signedArea(le1.point, le1.otherEvent.point, le2.otherEvent.point) !== 0) {

    // Left endpoints exactly identical? Use the right endpoint to sort
    if (equals(le1.point, le2.point)) return le1.isBelow(le2.otherEvent.point) ? -1 : 1;

    // Left endpoints identical in x, but different in y? Sort by y
    if (le1.point[0] === le2.point[0]) return le1.point[1] < le2.point[1] ? -1 : 1;

    // Default case:
    // - Determine which segment is older, i.e., has been inserted before in the sweep line.
    // - Project the left/start point of the new segment onto the existing segment.
    // - If this point falls exactly onto the existing segment, use the right point to sort.
    var oldEvt, newEvt, invertSignedArea;
    if (compareEvents(le1, le2) === -1) {
      oldEvt = le1;
      newEvt = le2;
      invertSignedArea = -1;
    } else {
      oldEvt = le2;
      newEvt = le1;
      invertSignedArea = 1;
    }

    let cmpNewLeftPoint = invertSignedArea * signedArea(newEvt.point, oldEvt.point, oldEvt.otherEvent.point);
    if (cmpNewLeftPoint !== 0) {
      return cmpNewLeftPoint;
    } else {
      return invertSignedArea * signedArea(newEvt.otherEvent.point, oldEvt.point, oldEvt.otherEvent.point);
    }
  }

  if (le1.isSubject === le2.isSubject) { // same polygon
    let p1 = le1.point, p2 = le2.point;
    if (p1[0] === p2[0] && p1[1] === p2[1]/*equals(le1.point, le2.point)*/) {
      p1 = le1.otherEvent.point; p2 = le2.otherEvent.point;
      if (p1[0] === p2[0] && p1[1] === p2[1]) return 0;
      else return le1.contourId > le2.contourId ? 1 : -1;
    } else {
      return compareEvents(le1, le2) === 1 ? 1 : -1;
    }
  } else { // Segments are collinear, but belong to separate polygons
    return le1.isSubject ? -1 : 1;
  }

}
