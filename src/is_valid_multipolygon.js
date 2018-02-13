'use strict';

// Validity definition comes from RFC 7946 sections 3.1.6 and 3.1.7 - https://tools.ietf.org/html/rfc7946

function isValidPolygonRing(ringCoords) {
  return ringCoords.length && ringCoords.length > 3 &&
    ringCoords[0][0] === ringCoords[ringCoords.length - 1][0] &&
    ringCoords[0][1] === ringCoords[ringCoords.length - 1][1];
}

module.exports = function isValidMultiPolygonCoords(coords) {
  try {
    if (!coords.length || coords.length < 1) { return false; }
    for (let polygonI = 0; polygonI < coords.length; ++polygonI) {
      let polygon = coords[polygonI];
      if (!polygon.length || polygon.length < 1) { return false; }
      for (let ringI = 0; ringI < polygon.length; ++ringI) {
        let ring = polygon[ringI];
        if (!isValidPolygonRing(ring)) { return false; }
      }
    }
    return true;
  } catch (ignored) { // If something blows up, coords weren't valid.
    return false;
  }
};
