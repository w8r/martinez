'use strict';

var tap             = require('tap');
var isValidMultiPolygonCoords = require('../src/is_valid_multipolygon');

tap.test('isValidMultiPolygonCoords', function (main) {
  main.test('passing non-array values returns false', function (t) {
    t.notOk(isValidMultiPolygonCoords(null));
    t.notOk(isValidMultiPolygonCoords(undefined));
    t.notOk(isValidMultiPolygonCoords(3));
    t.notOk(isValidMultiPolygonCoords({}));
    t.notOk(isValidMultiPolygonCoords('garbage'));
    t.end();
  });

  main.test('passing 3-level deep coords (Polygon) returns false', function (t) {
    t.notOk(isValidMultiPolygonCoords([[[0, 0], [0, 10], [10, 10], [0, 0]]]));
    t.end();
  });

  main.test('MultiPolygon containing unclosed ring returns false', function (t) {
    t.notOk(isValidMultiPolygonCoords([[[[0, 0], [0, 10], [10, 10], [10, 5]]]]));
    t.end();
  });

  main.test('MultiPolygon containing ring with not enough coords returns false', function (t) {
    t.notOk(isValidMultiPolygonCoords([[[[0, 0], [0, 10], [0, 0]]]]));
    t.end();
  });

  main.test('MultiPolygon containing invalid inner ring returns false', function (t) {
    t.notOk(isValidMultiPolygonCoords([[
      [[0, 0], [0, 10], [10, 10], [0, 0]],
      [[1, 1], [1, 9], [1, 1]]
    ]]));
    t.end();
  });

  main.test('MultiPolygon containing one valid polygon and one invalid polygon returns false', function (t) {
    t.notOk(isValidMultiPolygonCoords([
      [[[0, 0], [0, 10], [10, 10], [0, 0]]],
      [[[1, 1], [1, 9], [1, 1]]]
    ]));
    t.end();
  });

  main.test('valid MultiPolygons return true', function (t) {
    t.ok([[[[0, 0.5], [0, 1.5], [1, 0.5], [1, 1.5], [0, 0.5]]]]);
    t.ok(isValidMultiPolygonCoords([[[[0, 0], [0, 1], [1, 0], [1, 1], [0, 0]]]]));
    t.ok(isValidMultiPolygonCoords([[
      [[0, 0], [0, 10], [10, 10], [0, 0]],
      [[1, 1], [1, 9], [9, 9], [1, 1]]
    ]]));
    t.ok(isValidMultiPolygonCoords([
      [[[0, 0], [0, 10], [10, 10], [0, 0]]],
      [[[1, 1], [1, 9], [9, 9], [1, 1]]]
    ]));
    t.end();
  });

  main.end();
});
