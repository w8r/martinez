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

const options = {
  onStart (event) { console.log(this.name); },
  onError (event) { console.log(event.target.error); },
  onCycle (event) { console.log(String(event.target)); },
  onComplete() {
    console.log('- Fastest is ' + this.filter('fastest').map('name') + '\n');
  }
};

const hole_hole = load.sync('./test/fixtures/hole_hole.geojson')
new Benchmark.Suite('Hole_Hole', options)
  .add('Martinez', () => {
    martinez.union(
      hole_hole.features[0].geometry.coordinates,
      hole_hole.features[1].geometry.coordinates);
  })
  .add('JSTS', () => {
    jstsUnion(hole_hole.features[0], hole_hole.features[1]);
  })
  .run();

const asia = load.sync('./test/fixtures/asia.geojson');
const unionPoly = load.sync('./test/fixtures/asia_unionPoly.geojson');
new Benchmark.Suite('Asia union', options)
  .add('Martinez', () => {
    martinez.union(
      asia.features[0].geometry.coordinates,
      unionPoly.geometry.coordinates);
  })
  .add('JSTS', () => jstsUnion(asia.features[0], unionPoly))
  .run();

const states = load.sync('./test/fixtures/states_source.geojson');
new Benchmark.Suite('States clip', options)
  .add('Martinez', () => {
    martinez.union(
      states.features[0].geometry.coordinates,
      states.features[1].geometry.coordinates);
  })
  .add('JSTS', () => {
    jstsUnion(states.features[0], states.features[1]);
  })
  .run();
