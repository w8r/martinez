import { subdivideSegments } from "./subdivide_segments";
import { connectEdges } from "./connect_edges";
import { fillQueue } from "./fill_queue";
import {
  INTERSECTION,
  DIFFERENCE,
  UNION,
  XOR,
  OperationType,
} from "./operation";
import { BoundingBox, Geometry, MultiPolygon, Polygon } from "./types";

const EMPTY: Geometry = [];

function trivialOperation(
  subject: Geometry,
  clipping: Geometry,
  operation: OperationType
) {
  let result: Geometry | null = null;
  if (subject.length * clipping.length === 0) {
    if (operation === INTERSECTION) {
      result = EMPTY;
    } else if (operation === DIFFERENCE) {
      result = subject;
    } else if (operation === UNION || operation === XOR) {
      result = subject.length === 0 ? clipping : subject;
    }
  }
  return result;
}

function compareBBoxes(
  subject: Geometry,
  clipping: Geometry,
  sbbox: BoundingBox,
  cbbox: BoundingBox,
  operation: OperationType
) {
  let result: Geometry | null = null;
  if (
    sbbox[0] > cbbox[2] ||
    cbbox[0] > sbbox[2] ||
    sbbox[1] > cbbox[3] ||
    cbbox[1] > sbbox[3]
  ) {
    if (operation === INTERSECTION) {
      result = EMPTY;
    } else if (operation === DIFFERENCE) {
      result = subject;
    } else if (operation === UNION || operation === XOR) {
      result = subject.concat(clipping) as Geometry;
    }
  }
  return result;
}

export default function boolean(
  subject: Geometry,
  clipping: Geometry,
  operation: OperationType
) {
  if (typeof subject[0][0][0] === "number") {
    subject = [subject] as MultiPolygon;
  }
  if (typeof clipping[0][0][0] === "number") {
    clipping = [clipping] as MultiPolygon;
  }
  let trivial = trivialOperation(subject, clipping, operation);
  if (trivial) return trivial === EMPTY ? null : trivial;
  const sbbox: BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];
  const cbbox: BoundingBox = [Infinity, Infinity, -Infinity, -Infinity];

  // console.time('fill queue');
  const eventQueue = fillQueue(
    subject as MultiPolygon,
    clipping as MultiPolygon,
    sbbox,
    cbbox,
    operation
  );
  //console.timeEnd('fill queue');

  trivial = compareBBoxes(subject, clipping, sbbox, cbbox, operation);
  if (trivial) return trivial === EMPTY ? null : trivial;
  // console.time('subdivide edges');
  const sortedEvents = subdivideSegments(
    eventQueue,
    subject,
    clipping,
    sbbox,
    cbbox,
    operation
  );
  //console.timeEnd('subdivide edges');

  // console.time('connect vertices');
  const contours = connectEdges(sortedEvents);
  //console.timeEnd('connect vertices');

  // Convert contours to polygons
  const polygons: MultiPolygon = [];
  for (let i = 0; i < contours.length; i++) {
    let contour = contours[i];
    if (contour.isExterior()) {
      // The exterior ring goes first
      let rings: Polygon = [contour.points];
      // Followed by holes if any
      for (let j = 0; j < contour.holeIds.length; j++) {
        let holeId = contour.holeIds[j];
        rings.push(contours[holeId].points);
      }
      polygons.push(rings);
    }
  }

  return polygons;
}
