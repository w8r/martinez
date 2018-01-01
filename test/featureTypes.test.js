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
  {
    testName: 'polyWithHoleToClipping',
    subjectPoly: 'polyWithHole',
  },
  {
    testName: 'multiPolyToClipping',
    subjectPoly: 'multiPoly',
  },
  {
    testName: 'multiPolyWithHoleToClipping',
    subjectPoly: 'multiPolyWithHole',
  }
];

testScenarios.forEach(function (ts) {
  var subject = load.sync(path.join(__dirname, 'featureTypes', ts.subjectPoly + '.geojson'));
  tap.test(ts.testName, function (t) {

    var expectedIntResult = load.sync(path.join(outDir, 'intersection', t._name + '.geojson'))
    if (expectedIntResult.geometry.type === 'Polygon') expectedIntResult.geometry.coordinates = [expectedIntResult.geometry.coordinates]
    var intResult = martinez.intersection(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(intResult, expectedIntResult.geometry.coordinates, ts.testName + ' - Intersect');

    var expectedXorResult = load.sync(path.join(outDir, 'xor', t._name + '.geojson'))
    if (expectedXorResult.geometry.type === 'Polygon') expectedXorResult.geometry.coordinates = [expectedXorResult.geometry.coordinates]
    var xorResult = martinez.xor(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(xorResult, expectedXorResult.geometry.coordinates, ts.testName + ' - XOR');

    var expectedDiffResult = load.sync(path.join(outDir, 'difference', t._name + '.geojson'))
    if (expectedDiffResult.geometry.type === 'Polygon') expectedDiffResult.geometry.coordinates = [expectedDiffResult.geometry.coordinates]
    var diffResult = martinez.diff(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(diffResult, expectedDiffResult.geometry.coordinates, ts.testName + ' - Difference');

    var expectedUnionResult = load.sync(path.join(outDir, 'union', t._name + '.geojson'))
    if (expectedUnionResult.geometry.type === 'Polygon') expectedUnionResult.geometry.coordinates = [expectedUnionResult.geometry.coordinates]
    var unionResult = martinez.union(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(unionResult, expectedUnionResult.geometry.coordinates, ts.testName + ' - Union');

    t.end();
  });

});

