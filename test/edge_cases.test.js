'use strict';

var tap      = require('tap');
var martinez = require('../src/');
var load     = require('load-json-file');
var path     = require('path');

tap.test('Edge cases', function(main) {

  main.test('touching hourglasses', function(t) {
    var shapes   = load.sync(path.join(__dirname, 'fixtures', 'hourglasses.geojson'));
    var subject  = shapes.features[0];
    var clipping = shapes.features[1];

    t.test('intersection', function(t) {
      var result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0.5],[0.25,0.75],[0,1],[0,0.5]]],[[[0.75,0.75],[1,0.5],[1,1],[0.75,0.75]]]]);

      t.end();
    });

    t.test('union', function(t) {
      var result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[0.5,0.5],[0.25,0.75],[0.5,1],[0,1.5],[0,1],[0,0.5],[0,0]]],[[[0.5,0.5],[1,0],[1,0.5],[1,1],[1,1.5],[0.5,1],[0.75,0.75],[0.5,0.5]]]]);

      t.end();
    });

    t.test('difference', function(t) {
      var result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[0.5,0.5],[0.25,0.75],[0,0.5],[0,0]]],[[[0.5,0.5],[1,0],[1,0.5],[0.75,0.75],[0.5,0.5]]]]);

      t.end();
    });

    t.end();
  });

  main.test('polygon + trapezoid', function(t) {
    var shapes   = load.sync(path.join(__dirname, 'fixtures', 'polygon_trapezoid_edge_overlap.geojson'));
    var subject  = shapes.features[0];
    var clipping = shapes.features[1];

    t.test('intersection', function(t) {
      var result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[3.5,3.5],[7,0],[14,0],[17.5,3.5],[3.5,3.5]]]]);

      t.end();
    });

    t.test('union', function(t) {
      var result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[7,0],[14,0],[21,0],[21,3.5],[17.5,3.5],[21,7],[0,7],[3.5,3.5],[0,3.5],[0,0]]]]);

      t.end();
    });

    t.test('difference', function(t) {
      var result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[7,0],[3.5,3.5],[0,3.5],[0,0]]],[[[14,0],[21,0],[21,3.5],[17.5,3.5],[14,0]]]]);

      t.end();
    });

    t.end();
  });

  main.end();
});
