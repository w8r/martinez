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
      t.deepEqual(result, [[[[-1883,-8.5],[-1783,-8.5],[-1783,-3],[-1883,-3],[-1883,-8.5]]]]);

      t.end();
    });

    t.test('union', function(t) {
      var result = martinez.union(
        subject.geometry.coordinates,
        clipping.geometry.coordinates
      );
      t.deepEqual(result, [[[[-1883,-25],[-1783,-25],[-1783,-8.5],[-1783,-3],[-1783,75],[-1883,75],[-1883,-3],[-1883,-8.5],[-1883,-25]]]]);

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

  main.test('disjoint union nesting', (t) => { // issue #47
    const p1 = [[[12.91,6.09],[12.91,6.91],[12.09,6.91],[12.09,6.09],[12.91,6.09]]
    ];
    const p2 = [
      [[12.75,6.25],[12.75,6.75],[11.75,6.75],[11.75,8.25],[12.75,8.25],[12.75,8.75],[11.75,8.75],[11.75,9.75],[11.25,9.75],[11.25,8.75],[10.25,8.75],[10.25,8.25],[11.25,8.25],[11.25,6.75],[10.25,6.75],[10.25,6.25],[12.75,6.25]],
      [[4.75,2.25],[4.75,2.75],[4.25,2.75],[4.25,2.25],[4.75,2.25]]
    ];
    t.deepEqual(martinez.union(p1, p2), [[[[[[4.25,2.25],[4.75,2.25],[4.75,2.75],[4.25,2.75],[4.25,2.25]]]]],[[[10.25,6.25],[12.09,6.25],[12.09,6.09],[12.91,6.09],[12.91,6.91],[12.09,6.91],[12.09,6.75],[11.75,6.75],[11.75,8.25],[12.75,8.25],[12.75,8.75],[11.75,8.75],[11.75,9.75],[11.25,9.75],[11.25,8.75],[10.25,8.75],[10.25,8.25],[11.25,8.25],[11.25,6.75],[10.25,6.75],[10.25,6.25]]]]);
    t.end();
  });

  main.test('no rounding error between intersection calculation and triangle area', (t) => {
    const p1 = [[
      [-62.8, -41],
      [-63.0001099, -41.1121599],
      [-62.93564, -41.0940399],
      [-62.8, -41]
    ]];
    const p2 =[[
      [-62.8, -41.2],
      [-62.8, -41],
      [-62.964969880531925, -41.10228339712406],
      [-63.0001099, -41.1121599],
      [-62.8, -41.2]
    ]];
    const expected = [[[
      [-63.0001099, -41.1121599],
      [-62.964969880531925, -41.10228339712406],
      [-62.8, -41],
      [-63.0001099, -41.1121599]
    ]]]

    t.deepEqual(martinez.diff(p1, p2), expected)
    t.end();
  });

  main.test('collapsed edges removed', (t) => {
    const p1 = [[
      [355,139],
      [420,202],
      [384,237],
      [353,205],
      [330,230],
      [330,230],
      [291,197]
    ]];
    const p2 =[[
      [355,139],
      [420,202],
      [384,237],
      [353,205],

      [330,230],
      [330,230],
      [291,197]
    ]];

    t.deepEqual(martinez.intersection(p1, p2), [[[[291,197],[330,230],[353,205],[384,237],[420,202],[355,139]]]]);
    t.end();
  });

  main.end();
});
