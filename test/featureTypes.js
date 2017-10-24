'use strict';

var tap      = require('tap');
var path     = require('path');
var load     = require('load-json-file');
var martinez = require('../src/');

var clipping = load.sync(path.join(__dirname, 'featureTypes', 'clippingPoly.geojson'));
var outDir = path.join(__dirname, 'featureTypes', 'out');

var testScenarios = [
  {
    testName: 'polyToClipping',
    subjectPoly: 'poly',
  },
  // {
  //   testName: 'polyWithHoleToClipping',
  //   subjectPoly: 'polyWithHole',
  // }
  {
    testName: 'multiPolyToClipping',
    subjectPoly: 'multiPoly',
  }
];

testScenarios.forEach(function (ts) {
  var subject = load.sync(path.join(__dirname, 'featureTypes', ts.subjectPoly + '.geojson'));
  tap.test(ts.testName, function (t) {
    var intResult = martinez.intersection(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(intResult, load.sync(path.join(outDir, 'intersection', t._name + '.geojson')).geometry.coordinates, ts.testName + ' - Intersect');

    var xorResult = martinez.xor(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(xorResult, load.sync(path.join(outDir, 'xor', t._name + '.geojson')).geometry.coordinates, ts.testName + ' - XOR');

    var diffResult = martinez.diff(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(diffResult, load.sync(path.join(outDir, 'difference', t._name + '.geojson')).geometry.coordinates, ts.testName + ' - Difference');

    var unionResult = martinez.union(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(unionResult, load.sync(path.join(outDir, 'union', t._name + '.geojson')).geometry.coordinates, ts.testName + ' - Union');

    t.end();
  });

});

