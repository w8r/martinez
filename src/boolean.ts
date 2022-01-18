import { MultiPolygon, BoundingBox, Polygon } from './types';
import subdivideSegments from './subdivide_segments';
import connectEdges from './connect_edges';
import fillQueue from './fill_queue';
import {
  INTERSECTION,
  DIFFERENCE,
  UNION,
  XOR,
  OperationType
} from './operation';
import { EMPTY } from './constants';

function trivialOperation(
  subject: MultiPolygon,
  clipping: MultiPolygon,
  operation: OperationType
) {
  if (subject.length * clipping.length === 0) {
    if (operation === INTERSECTION) return EMPTY;
    if (operation === DIFFERENCE) return subject;
    if (operation === UNION || operation === XOR) {
      return subject.length === 0 ? clipping : subject;
    }
  }
  return null;
}

function checkOverlap(
  subject: MultiPolygon,
  clipping: MultiPolygon,
  sbbox: BoundingBox,
  cbbox: BoundingBox,
  operation: OperationType
) {
  if (
    sbbox[0] > cbbox[2] ||
    cbbox[0] > sbbox[2] ||
    sbbox[1] > cbbox[3] ||
    cbbox[1] > sbbox[3]
  ) {
    if (operation === INTERSECTION) return EMPTY;
    if (operation === DIFFERENCE) return subject;
    if (operation === UNION || operation === XOR)
      return subject.concat(clipping);
  }
  return null;
}

export default function boolean(
  subject: MultiPolygon | Polygon,
  clipping: MultiPolygon | Polygon,
  operation: OperationType
) {
  const s =
    typeof subject[0][0][0] === 'number'
      ? ([subject] as MultiPolygon)
      : (subject as MultiPolygon);
  const c =
    typeof clipping[0][0][0] === 'number'
      ? ([clipping] as MultiPolygon)
      : (clipping as MultiPolygon);

  let trivial = trivialOperation(s, c, operation);
  if (trivial) return trivial === EMPTY ? null : trivial;

  const sbbox: BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];
  const cbbox: BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];

  // console.time('fill queue');
  const eventQueue = fillQueue(s, c, sbbox, cbbox, operation);
  //console.timeEnd('fill queue');

  trivial = checkOverlap(s, c, sbbox, cbbox, operation);
  if (trivial) return trivial === EMPTY ? null : trivial;

  // console.time('subdivide edges');
  const sortedEvents = subdivideSegments(eventQueue, sbbox, cbbox, operation);
  //console.timeEnd('subdivide edges');

  // console.time('connect vertices');
  const contours = connectEdges(sortedEvents);
  //console.timeEnd('connect vertices');

  // Convert contours to polygons
  const polygons: MultiPolygon = [];
  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];
    if (contour.isExterior()) {
      // The exterior ring goes first
      const rings = [contour.points];
      // Followed by holes if any
      for (let j = 0; j < contour.holeIds.length; j++) {
        const holeId = contour.holeIds[j];
        rings.push(contours[holeId].points);
      }
      polygons.push(rings);
    }
  }

  return polygons;
}
