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

    t.test('difference 2', function(t) {
      var result = martinez.diff(
        clipping.geometry.coordinates,
        subject.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,1],[0.25,0.75],[0.5,1],[0,1.5],[0,1]]],[[[0.5,1],[0.75,0.75],[1,1],[1,1.5],[0.5,1]]]]);

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

  main.test('overlapping edge + one inside', function(t) {
    var shapes   = load.sync(path.join(__dirname, 'fixtures', 'overlap_loop.geojson'));
    var subject  = shapes.features[0];
    var clipping = shapes.features[1];

    t.test('intersection', function(t) {
      var result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[57.8,-49.1],[177.8,-49.1],[177.8,-37.1],[57.8,-37.1],[57.8,-49.1]]]]);

      t.end();
    });

    t.test('union', function(t) {
      var result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[57.8,-97.1],[196.4,-97.1],[196.4,-11.5],[57.8,-11.5],[57.8,-37.1],[57.8,-49.1],[57.8,-97.1]]]]);

      t.end();
    });

    t.test('difference', function(t) {
      var result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, []);

      t.end();
    });

    t.end();
  });

  main.test('overlapping Y shift', function(t) {
    var shapes   = load.sync(path.join(__dirname, 'fixtures', 'overlap_y.geojson'));
    var subject  = shapes.features[0];
    var clipping = shapes.features[1];

    t.test('intersection', function(t) {
      var result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[-1883,-8.5],[-1783,-8.5],[-1783,-3],[-1783,-2.999999999999999],[-1883,-3],[-1883,-8.5]]]]);

      t.end();
    });

    t.test('union', function(t) {
      var result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[-1883,-25],[-1783,-25],[-1783,-8.5],[-1783,-3],[-1783,-2.999999999999999],[-1783,75],[-1883,75],[-1883,-3],[-1883,-8.5],[-1883,-25]]]]);

      t.end();
    });

    t.test('difference', function(t) {
      var result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, []);

      t.end();
    });

    t.end();
  });

  main.test('touching boxes', function(t) {
    var shapes   = load.sync(path.join(__dirname, 'fixtures', 'touching_boxes.geojson'));
    var subject  = shapes.features[0];
    var clipping = shapes.features[1];

    t.test('intersection', function(t) {
      var result = martinez.intersection(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, []);

      t.end();
    });

    t.test('union', function(t) {
      var result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[3,0],[3,1],[4,1],[4,2],[3,2],[3,3],[0,3],[0,0]]]]);

      t.end();
    });

    t.test('difference', function(t) {
      var result = martinez.diff(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[0,0],[3,0],[3,1],[3,2],[3,3],[0,3],[0,0]]]]);

      t.end();
    });

    t.end();
  });

  main.end();
});
