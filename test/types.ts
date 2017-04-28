import * as martinez from '../'

// Fixtures
const poly1 = {
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[22, 24], [38, 24], [38, 37], [22, 37], [22, 24]]]
  }
}
const poly2 = {
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[32, 34], [48, 34], [48, 47], [32, 47], [32, 34]]]
  }
}
const multiPoly = {
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [
      [[[22, 24], [38, 24], [38, 37], [22, 37], [22, 24]]],
      [[[32, 34], [48, 34], [48, 47], [32, 47], [32, 34]]]
    ]
  }
}
const poly1Coords = poly1.geometry.coordinates
const poly2Coords = poly2.geometry.coordinates
const multiPolyCoords = multiPoly.geometry.coordinates

// <method>(Polygon, Polygon)
martinez.xor(poly1Coords, poly2Coords)
martinez.diff(poly1Coords, poly2Coords)
martinez.union(poly1Coords, poly2Coords)
martinez.intersection(poly1Coords, poly2Coords)

// <method>(Poly, MultiPoly)
martinez.xor(poly1Coords, multiPolyCoords)
martinez.diff(poly1Coords, multiPolyCoords)
martinez.union(poly1Coords, multiPolyCoords)
martinez.intersection(poly1Coords, multiPolyCoords)
