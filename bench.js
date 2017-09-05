const path = require('path');
const load = require('load-json-file');
const Benchmark = require('benchmark');
const jstsUnion = require('@turf/union');
const fs = require('fs');
const martinez = require('./src/index');


/**
 * Benmark Results
 *
 * Hole_Hole x 13,345 ops/sec ±2.13% (91 runs sampled)
 * Hole_Hole - JSTS x 1,724 ops/sec ±4.80% (87 runs sampled)
 * Asia x 6.32 ops/sec ±3.16% (20 runs sampled)
 * Asia - JSTS x 6.62 ops/sec ±2.74% (21 runs sampled)
 */



// Define benchmark
const suite = new Benchmark.Suite('martinez');

var hole_hole = load.sync('./test/fixtures/hole_hole.geojson')
suite.add('Hole_Hole', () => martinez.union(hole_hole.features[0].geometry.coordinates, hole_hole.features[1].geometry.coordinates));
suite.add('Hole_Hole - JSTS', () => jstsUnion(hole_hole.features[0], hole_hole.features[1]))

var asia = load.sync('./test/fixtures/asia.geojson')
var unionPoly = load.sync('./test/fixtures/asia_unionPoly.geojson')
suite.add('Asia', () => martinez.union(asia.features[0].geometry.coordinates, unionPoly.geometry.coordinates));
suite.add('Asia - JSTS', () => jstsUnion(asia.features[0], unionPoly))

suite
  .on('cycle', e => console.log(String(e.target)))
  .on('complete', () => {})
  .run();