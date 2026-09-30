import subdivideSegments from "./subdivide_segments";
import connectEdges from "./connect_edges";
import fillQueue from "./fill_queue";
import isDegenerateRing from "./is_degenerate_ring";
import normalizeContour from "./normalize_contour";
import { INTERSECTION, DIFFERENCE, UNION, XOR } from "./operation";
import { Geometry, Polygon, MultiPolygon, BBox } from "./types";

// Marks an empty result of the trivial paths; returned as null
const EMPTY: MultiPolygon = [];

function trivialOperation(
  subject: MultiPolygon,
  clipping: MultiPolygon,
  operation: number
): MultiPolygon | null {
  let result: MultiPolygon | null = null;
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
  subject: MultiPolygon,
  clipping: MultiPolygon,
  sbbox: BBox,
  cbbox: BBox,
  operation: number
): MultiPolygon | null {
  let result: MultiPolygon | null = null;
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
      result = subject.concat(clipping);
    }
  }
  return result;
}

/**
 * Drops rings that enclose no area, and polygons whose exterior ring does
 * not. They contribute nothing to the result but confuse edge connection
 * (#65). Returns the input unchanged when there is nothing to drop.
 */
function removeDegenerateRings(multiPolygon: MultiPolygon): MultiPolygon {
  let result: MultiPolygon | null = null;
  for (let i = 0; i < multiPolygon.length; i++) {
    const polygon = multiPolygon[i];
    let kept: Polygon | null = null;
    for (let j = 0; j < polygon.length; j++) {
      const degenerate = isDegenerateRing(polygon[j]);
      if (degenerate && kept === null) kept = polygon.slice(0, j);
      else if (!degenerate && kept !== null) kept.push(polygon[j]);
      if (degenerate && j === 0) break;
    }
    if (kept !== null && result === null) result = multiPolygon.slice(0, i);
    if (result !== null) {
      const cleaned = kept === null ? polygon : kept;
      if (cleaned.length > 0) result.push(cleaned);
    }
  }
  return result === null ? multiPolygon : result;
}

export default function boolean(
  subject: Geometry,
  clipping: Geometry,
  operation: number
): MultiPolygon | null {
  let subjectMP: MultiPolygon = subject as MultiPolygon;
  let clippingMP: MultiPolygon = clipping as MultiPolygon;

  if (typeof subject[0][0][0] === "number") {
    subjectMP = [subject as Polygon];
  }
  if (typeof clipping[0][0][0] === "number") {
    clippingMP = [clipping as Polygon];
  }
  subjectMP = removeDegenerateRings(subjectMP);
  clippingMP = removeDegenerateRings(clippingMP);
  let trivial = trivialOperation(subjectMP, clippingMP, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  const sbbox: BBox = [Infinity, Infinity, -Infinity, -Infinity];
  const cbbox: BBox = [Infinity, Infinity, -Infinity, -Infinity];

  const eventQueue = fillQueue(subjectMP, clippingMP, sbbox, cbbox, operation);

  trivial = compareBBoxes(subjectMP, clippingMP, sbbox, cbbox, operation);
  if (trivial) {
    return trivial === EMPTY ? null : trivial;
  }
  const sortedEvents = subdivideSegments(
    eventQueue,
    subjectMP,
    clippingMP,
    sbbox,
    cbbox,
    operation
  );

  const contours = connectEdges(sortedEvents);

  // Clean up output rings; degenerate ones become null and are left out
  const rings = contours.map((contour) => normalizeContour(contour.points));

  // Convert contours to polygons
  const polygons: MultiPolygon = [];
  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];
    const ring = rings[i];
    if (contour.isExterior() && ring !== null) {
      // The exterior ring goes first
      const polygon: Polygon = [ring];
      // Followed by holes if any
      for (let j = 0; j < contour.holeIds.length; j++) {
        const hole = rings[contour.holeIds[j]];
        if (hole !== null) polygon.push(hole);
      }
      polygons.push(polygon);
    }
  }

  return polygons;
}
