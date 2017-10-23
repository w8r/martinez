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
  }
];

testScenarios.forEach(function (ts) {
  var subject = load.sync(path.join(__dirname, 'featureTypes', ts.subjectPoly + '.geojson'));

  tap.test(ts.testName, function (t) {
    var intResult = martinez.intersection(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(intResult[0], load.sync(path.join(outDir, 'intersection', t._name + '.geojson')).geometry.coordinates);

    var xorResult = martinez.xor(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(xorResult, load.sync(path.join(outDir, 'xor', t._name + '.geojson')).geometry.coordinates);

    var diffResult = martinez.diff(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(diffResult[0], load.sync(path.join(outDir, 'difference', t._name + '.geojson')).geometry.coordinates);

    var unionResult = martinez.union(subject.geometry.coordinates, clipping.geometry.coordinates);
    t.same(unionResult[0], load.sync(path.join(outDir, 'union', t._name + '.geojson')).geometry.coordinates);

    t.end();
  });

});

